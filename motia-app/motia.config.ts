import { defineConfig } from "@motiadev/core"
import bullmqPlugin from "@motiadev/plugin-bullmq/plugin"
import endpointPlugin from "@motiadev/plugin-endpoint/plugin"
import logsPlugin from "@motiadev/plugin-logs/plugin"
import observabilityPlugin from "@motiadev/plugin-observability/plugin"
import statesPlugin from "@motiadev/plugin-states/plugin"
import crypto from "crypto"
import multer from "multer"
import { mkdirSync } from "node:fs"
import fs from "node:fs/promises"
import { join } from "node:path"
import { db } from "../motia-app/src/lib/db"

const STORAGE_PATH_BASE = process.env.STORAGE_PATH_BASE
const TARGET_PATH_BASE = process.env.TARGET_PATH_BASE
if (!STORAGE_PATH_BASE || !TARGET_PATH_BASE) {
	throw new Error("Environments variable not setted")
}

// Use memory storage temporarily, then move files to final location
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

export default defineConfig({
	plugins: [
		observabilityPlugin,
		statesPlugin,
		endpointPlugin,
		logsPlugin,
		bullmqPlugin,
	],
	app: (app) => {
		app.post("/api/files-upload", upload.array("files"), async (req, res) => {
			try {
				const { userId, fileType, folderId } = req.body
				const files = req.files as Express.Multer.File[]

				if (!files || files.length === 0) {
					return res
						.status(400)
						.json({ status: "error", message: "No files provided" })
				}

				if (!userId || !folderId) {
					return res.status(400).json({
						status: "error",
						message: "userId and folderId are required",
					})
				}

				const fileNames = files.map((file) => file.originalname)
				const selectedType =
					fileType === "sourceFiles"
						? "sourceFiles"
						: fileType === "datasetsFiles"
							? "datasetsFiles"
							: "reqFile"

				const job = await db
					.selectFrom("Job")
					.select([selectedType, "status", "id"])
					.where("folderId", "=", folderId)
					.executeTakeFirst()

				if (!job) {
					return res
						.status(404)
						.json({ status: "error", message: "Job not found" })
				}

				// search if any run using this job is active
				const activeRuns = await db
					.selectFrom("Run")
					.where("jobId", "=", job.id)
					.where("status", "in", ["PREPARING", "QUEUED", "RUNNING"])
					.select(["id"])
					.execute()

				if (activeRuns.length > 0) {
					return {
						status: 400,
						body: {
							success: false,
							message:
								"Cannot upload files while there are active runs using this job",
						},
					}
				}

				// Determine target directory
				let targetDir: string = ""
				if (fileType === "sourceFiles") {
					targetDir = join(
						STORAGE_PATH_BASE,
						userId,
						"jobs",
						folderId,
						"source",
					)
				} else if (fileType === "datasetsFiles") {
					targetDir = join(STORAGE_PATH_BASE, userId, "datasets")
				} else {
					targetDir = join(STORAGE_PATH_BASE, userId, "jobs", folderId)
				}

				// Create directory
				mkdirSync(targetDir, { recursive: true })

				// Write files to disk
				const { writeFileSync } = await import("node:fs")
				for (const file of files) {
					const filePath = join(targetDir, file.originalname)
					writeFileSync(filePath, file.buffer)
				}

				// const sourceFilesFilesPath: string = `${TARGET_PATH_BASE}/${userName}/jobs/${folderId}/source`
				// const datasetsFilesFilesPath: string = `/datasets/${userName}`
				// const targetPath =
				// 	fileType === "sourceFiles"
				// 		? sourceFilesFilesPath
				// 		: fileType === "datasetsFiles"
				// 			? datasetsFilesFilesPath
				// 			: `${TARGET_PATH_BASE}/${userName}/jobs/${folderId}`

				// const { client }: any = await sshManager.getSession(
				// 	userId,
				// 	userName,
				// 	userPassword,
				// )

				// await sshManager.runCommand(client, `mkdir -p ${targetPath}`)

				// for (const file of files) {
				// 	const remoteFilePath = `${targetPath}/${file.originalname}`
				// 	try {
				// 		// Use the disk file path we just created
				// 		const localFilePath = join(targetDir, file.originalname)
				// 		await sshManager.uploadFile(userId, localFilePath, remoteFilePath)
				// 		console.log(`${file.originalname} file uploaded successfully`)
				// 	} catch (error) {
				// 		console.error(`Failed to upload ${file.originalname}:`, error)
				// 		throw error
				// 	}
				// }

				// update database with files names
				const existingFiles = ((job as any)[selectedType] as string[]) || []
				const updatedFiles = [...new Set([...existingFiles, ...fileNames])]

				if (fileType === "sourceFiles") {
					await db
						.updateTable("Job")
						.set({ sourceFiles: updatedFiles })
						.where("folderId", "=", folderId)
						.executeTakeFirst()
				} else if (fileType === "datasetsFiles") {
					await db
						.updateTable("Job")
						.set({ datasetsFiles: updatedFiles })
						.where("folderId", "=", folderId)
						.executeTakeFirst()
				} else {
					await db
						.updateTable("Job")
						.set({ reqFile: updatedFiles[0] })
						.where("folderId", "=", folderId)
						.executeTakeFirst()
				}

				if (fileType === "reqFile") {
					// Leer el contenido del archivo de requirements
					const content = await fs.readFile(
						join(targetDir, fileNames[0]),
						"utf-8",
					)

					// Normalizar (quitar espacios, líneas vacías y ordenar para que el orden no afecte el hash)
					const normalized = content
						.split("\n")
						.map((line) => line.trim())
						.filter((line) => line.length > 0)
						.sort()
						.join("\n")

					// Generar el Hash SHA-256
					const hash = crypto
						.createHash("sha256")
						.update(normalized)
						.digest("hex")

					// Verificar si el entorno ya existe en la base de datos

					const environment = await db
						.selectFrom("Environment")
						.where("hashedReqs", "=", hash)
						.selectAll()
						.executeTakeFirst()

					// Crear el directorio y el registro si no existe
					if (!environment) {
						// const venvPath = `${TARGET_PATH_BASE}/${userName}/shared_envs/env_${hash}`
						// await sshManager.runCommand(client, `mkdir -p ${venvPath}`)

						await db
							.insertInto("Environment")
							.values({
								id: crypto.randomUUID(),
								createdAt: new Date(),
								updatedAt: new Date(),
								requirementsContent: content,
								hashedReqs: hash,
								userId: userId,
							})
							.executeTakeFirst()

						// 6. Emitir evento para crear el entorno virtual si no existe
						// await fetch(
						// 	`http://localhost:${process.env.PORT}/api/trigger-env-creation`,
						// 	{
						// 		method: "POST",
						// 		headers: { "Content-Type": "application/json" },
						// 		body: JSON.stringify({
						// 			userId,
						// 			userName,
						// 			userPassword,
						// 			requirementsContent: content,
						// 			hash,
						// 			venvPath,
						// 			folderId,
						// 		}),
						// 	},
						// ).catch((err) => {
						// 	console.error("Error triggering environment creation:", err)
						// })
					}
				}

				const updatedJob = await db
					.selectFrom("Job")
					.where("folderId", "=", folderId)
					.select(["sourceFiles", "reqFile"])
					.executeTakeFirst()

				if (updatedJob?.reqFile && updatedJob.sourceFiles.length > 0) {
					await db
						.updateTable("Job")
						.set({ status: "READY" })
						.where("folderId", "=", folderId)
						.executeTakeFirst()
				}

				return res
					.status(200)
					.json({ status: "success", message: "Files uploaded successfully" })
			} catch (error) {
				console.error("Error during file upload process:", error)
				return res
					.status(500)
					.json({ status: "error", message: "File upload failed", error })
			}
		})
	},
})
