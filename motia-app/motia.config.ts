import { defineConfig } from "@motiadev/core"
import bullmqPlugin from "@motiadev/plugin-bullmq/plugin"
import endpointPlugin from "@motiadev/plugin-endpoint/plugin"
import logsPlugin from "@motiadev/plugin-logs/plugin"
import observabilityPlugin from "@motiadev/plugin-observability/plugin"
import statesPlugin from "@motiadev/plugin-states/plugin"
import multer from "multer"
import { mkdirSync } from "node:fs"
import { join } from "node:path"
import { db } from "../motia-app/src/lib/db"
import { sshManager } from "../motia-app/src/lib/sshManager"

const STORAGE_PATH_BASE = process.env.STORAGE_PATH_BASE
if (!STORAGE_PATH_BASE) {
	throw new Error("STORAGE_PATH_BASE environment variable is not set")
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
				const { userId, userName, userPassword, fileType, folderId } = req.body
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

				const sourceFilesFilesPath: string = `${process.env.TARGET_PATH_BASE}/${userName}/jobs/${folderId}/source`
				const datasetsFilesFilesPath: string = `/datasets/${userName}`
				const targetPath =
					fileType === "sourceFiles"
						? sourceFilesFilesPath
						: fileType === "datasetsFiles"
							? datasetsFilesFilesPath
							: `${process.env.TARGET_PATH_BASE}/${userName}/jobs/${folderId}`

				const { client }: any = await sshManager.getSession(
					userId,
					userName,
					userPassword,
				)

				await sshManager.runCommand(client, `mkdir -p ${targetPath}`)

				for (const file of files) {
					const remoteFilePath = `${targetPath}/${file.originalname}`
					try {
						// Use the disk file path we just created
						const localFilePath = join(targetDir, file.originalname)
						await sshManager.uploadFile(userId, localFilePath, remoteFilePath)
						console.log(`${file.originalname} file uploaded successfully`)
					} catch (error) {
						console.error(`Failed to upload ${file.originalname}:`, error)
						throw error
					}
				}

				// update database with files names
				const fileNames = files.map((file) => file.originalname)
				const selectedType =
					fileType === "sourceFiles"
						? "sourceFiles"
						: fileType === "datasetsFiles"
							? "datasetsFiles"
							: "reqFile"

				const job = await db
					.selectFrom("Job")
					.select([selectedType])
					.where("folderId", "=", folderId)
					.executeTakeFirst()

				if (!job) {
					return res
						.status(404)
						.json({ status: "error", message: "Job not found" })
				}

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
