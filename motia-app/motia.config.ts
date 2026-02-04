import { defineConfig } from "@motiadev/core"
import bullmqPlugin from "@motiadev/plugin-bullmq/plugin"
import endpointPlugin from "@motiadev/plugin-endpoint/plugin"
import logsPlugin from "@motiadev/plugin-logs/plugin"
import observabilityPlugin from "@motiadev/plugin-observability/plugin"
import statesPlugin from "@motiadev/plugin-states/plugin"
import crypto from "crypto"
import multer from "multer"
import { nanoid } from "nanoid"
import fs from "node:fs/promises"
import { basename, join } from "node:path"
import { db } from "../motia-app/src/lib/db"
import { readNpyFile } from "../motia-app/src/lib/readFiles"

const STORAGE_PATH_BASE = process.env.STORAGE_PATH_BASE
if (!STORAGE_PATH_BASE) throw new Error("STORAGE_PATH_BASE not set")

const upload = multer({ storage: multer.memoryStorage() })

export default defineConfig({
	plugins: [
		observabilityPlugin,
		statesPlugin,
		endpointPlugin,
		logsPlugin,
		bullmqPlugin,
	],
	app: (app) => {
		app.post(
			"/api/files-upload",
			upload.array("files"),
			async (req, res) => {
				const { userName, userId, fileType, jobId, readmeContent } = req.body
				const files = req.files as Express.Multer.File[]

				if (!files?.length)
					return res
						.status(400)
						.json({ status: "error", message: "No files provided" })
				if (!userId || !jobId || !fileType)
					return res
						.status(400)
						.json({ status: "error", message: "Missing required fields" })

				// --- 1. LÓGICA ESPECÍFICA PARA DATASETS ---
				if (fileType === "datasetFile") {
					if (!userName || !readmeContent?.trim()) {
						return res.status(400).json({
							status: "error",
							message: "userName and readmeContent are required for datasets",
						})
					}

					const safeFileName = basename(files[0].originalname)

					const dataset = await db
						.selectFrom("Dataset")
						.where("fileName", "=", safeFileName)
						.where("userId", "=", userId)
						.select("id")
						.executeTakeFirst()

					if (dataset) {
						return res.status(400).json({
							status: "error",
							message: "A dataset with this file name already exists",
						})
					}

					const newFolderId = `${safeFileName.split(".")[0].replace(/\s+/g, "_").toLowerCase()}-${nanoid(7)}`
					const datasetDir = join(
						STORAGE_PATH_BASE,
						userId,
						"datasets",
						newFolderId,
					)

					try {
						await fs.mkdir(datasetDir, { recursive: true })
						const readmeFileContent = `# Dataset Readme\n\nFile: ${safeFileName}\nContact: ${userName}@laas.fr\n\n## Description\n${readmeContent}`

						await fs.writeFile(
							join(datasetDir, "README.md"),
							readmeFileContent,
							"utf-8",
						)
						await fs.writeFile(join(datasetDir, safeFileName), files[0].buffer)

						try {
							await db
								.insertInto("Dataset")
								.values({
									id: crypto.randomUUID(),
									createdAt: new Date(),
									updatedAt: new Date(),
									fileName: safeFileName,
									folderId: newFolderId,
									userId: userId,
									readmeContent: readmeContent,
								})
								.executeTakeFirst()

							return res
								.status(200)
								.json({ status: "success", message: "Dataset uploaded" })
						} catch (dbError) {
							await fs.rm(datasetDir, { recursive: true, force: true }) // Rollback disk
							throw dbError
						}
					} catch (error) {
						console.error("Dataset upload error:", error)
						return res
							.status(500)
							.json({ status: "error", message: "Internal server error" })
					}
				}

				// --- 2. LÓGICA PARA SOURCE Y REQUIREMENTS ---
				try {
					const job = await db
						.selectFrom("Job")
						.select(["id", "sourceFiles", "environmentId", "folderId", "name"])
						.where("id", "=", jobId)
						.executeTakeFirst()

					if (!job)
						return res
							.status(404)
							.json({ status: "error", message: "Job not found" })

					// Bloqueo si hay Runs activos
					const activeRun = await db
						.selectFrom("Run")
						.where("jobId", "=", job.id)
						.where("status", "in", ["PREPARING", "QUEUED", "RUNNING"])
						.select("id")
						.executeTakeFirst()

					if (activeRun) {
						return res.status(400).json({
							status: "error",
							message: "Cannot upload files while there are active runs",
						})
					}

					const folderName = `${job.name.replace(/\s+/g, "_").toLowerCase()}-${job.folderId}`
					const isSource = fileType === "sourceFiles"
					const targetDir = isSource
						? join(STORAGE_PATH_BASE, userId, "jobs", folderName, "source")
						: join(STORAGE_PATH_BASE, userId, "jobs", folderName)

					await fs.mkdir(targetDir, { recursive: true })

					const uploadedFileNames: string[] = []
					for (const file of files) {
						const safeName = basename(file.originalname)
						await fs.writeFile(join(targetDir, safeName), file.buffer)
						uploadedFileNames.push(safeName)
					}

					// Actualización unificada de DB
					if (isSource) {
						const currentFiles = (job.sourceFiles as string[]) || []
						const updated = [
							...new Set([...currentFiles, ...uploadedFileNames]),
						]
						await db
							.updateTable("Job")
							.set({ sourceFiles: updated })
							.where("id", "=", job.id)
							.execute()
					} else {
						// Lógica de Hash de Requirements
						const rawContent = files[0].buffer.toString("utf-8")
						const normalized = rawContent
							.split("\n")
							.map((l) => l.trim())
							.filter((l) => l)
							.sort()
							.join("\n")
						const hash = crypto
							.createHash("sha256")
							.update(normalized)
							.digest("hex")

						const envExists = await db
							.selectFrom("Environment")
							.where("hashedReqs", "=", hash)
							.select("id")
							.executeTakeFirst()

						const environmentId = envExists ? envExists.id : crypto.randomUUID()
						if (!envExists) {
							await db
								.insertInto("Environment")
								.values({
									id: environmentId,
									createdAt: new Date(),
									updatedAt: new Date(),
									requirementsContent: rawContent,
									hashedReqs: hash,
									userId: userId,
								})
								.execute()

							await db
								.updateTable("Job")
								.set({ environmentId: environmentId })
								.where("id", "=", job.id)
								.execute()
						}
					}

					// Auto-Ready status
					const finalJob = await db
						.selectFrom("Job")
						.where("id", "=", job.id)
						.select(["sourceFiles", "environmentId"])
						.executeTakeFirst()
					if (
						finalJob?.environmentId &&
						(finalJob.sourceFiles as string[]).length > 0
					) {
						await db
							.updateTable("Job")
							.set({ status: "READY" })
							.where("id", "=", job.id)
							.execute()
					}

					return res
						.status(200)
						.json({ status: "success", message: "Files uploaded successfully" })
				} catch (error) {
					console.error("Upload error:", error)
					return res
						.status(500)
						.json({ status: "error", message: "File upload failed" })
				}
			},
			app.post("/api/upload", upload.single("file"), async (req, res) => {
				try {
					const { userId, fileType } = req.body
					const file = req.file as Express.Multer.File

					if (!fileType)
						return res
							.status(400)
							.json({ success: false, message: "Missing fileType" })

					// for results files
					if (fileType === "resultsFile") {
						if (!file || !userId)
							return res
								.status(400)
								.json({ success: false, message: "Missing required fields" })

						const targetDir = join(STORAGE_PATH_BASE, userId, "files")
						await fs.mkdir(targetDir, { recursive: true })

						const safeName = basename(file.originalname)
						const filePath = join(targetDir, safeName)

						try {
							await fs.writeFile(filePath, file.buffer)
						} catch (error) {
							console.error("Error writing file:", error)
							return res
								.status(500)
								.json({ success: false, message: "File write error" })
						}

						let shape = null
						try {
							shape = (await readNpyFile(userId, safeName)).shape
						} catch (error) {
							console.error("Error reading file shape:", error)
							return res
								.status(500)
								.json({ success: false, message: "File read error" })
						}
						const savedFile = {
							fileName: safeName,
							fileSize: file.size,
							fileShape: shape,
						}
						return res.status(200).json({
							success: true,
							message: `Results file ${safeName} uploaded successfully`,
							file: savedFile,
						})
					}

					// for avatar files
					if (fileType === "avatarFile") {
						if (!file || !userId)
							return res
								.status(400)
								.json({ success: false, message: "Missing required fields" })

						const targetDir = join(STORAGE_PATH_BASE, userId)

						await fs.mkdir(targetDir, { recursive: true })

						const safeName = basename(file.originalname)
						const filePath = join(targetDir, safeName)

						try {
							await fs.writeFile(filePath, file.buffer)
						} catch (error) {
							console.error("Error writing file:", error)
							return res
								.status(500)
								.json({ success: false, message: "File write error" })
						}
						return res.status(200).json({
							success: true,
							message: `Avatar file ${safeName} uploaded successfully`,
						})
					}
				} catch (error) {
					console.error(error)
					return res
						.status(500)
						.json({ success: false, message: "Internal server error" })
				}
			}),
		)
	},
})
