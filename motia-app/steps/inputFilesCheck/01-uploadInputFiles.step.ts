import { ApiRouteConfig, Handlers } from "motia"
import { promises as fs } from "node:fs"
import path from "node:path"
import { z } from "zod"

const UploadFilesSchema = z.object({
	userId: z.string(),
	simId: z.string(),
	files: z.array(
		z.object({
			filename: z.string(),
			contentType: z.string(),
			data: z.string(), // Base64 encoded
		})
	),
})

export const config: ApiRouteConfig = {
	type: "api",
	name: "UploadInputFiles",
	description: "Upload input files for a simulation",
	path: "/simulations/upload-files",
	method: "POST",
	bodySchema: UploadFilesSchema,
	emits: ["filesUploaded"],
	flows: ["filesCheck"],
}

export const handler: Handlers["UploadInputFiles"] = async (
	req: any,
	{ logger, emit }: any
) => {
	try {
		const { userId, simId, files } = req.body

		// Validate input
		if (!userId || !simId) {
			return {
				status: 400,
				body: { error: "userId and simId are required" },
			}
		}

		if (!Array.isArray(files) || files.length === 0) {
			return {
				status: 400,
				body: { error: "files must be a non-empty array" },
			}
		}

		const SIMFILES_BASE_DIR =
			process.env.SIMFILES_BASE_DIR ||
			path.resolve(process.cwd(), "..", "data", "simfiles")

		const uploadDir = path.join(SIMFILES_BASE_DIR, userId, simId, "input-files")

		// Create directory if it doesn't exist
		await fs.mkdir(uploadDir, { recursive: true })

		const uploadedFiles: {
			filename: string
			size: number
			path: string
		}[] = []

		for (const file of files) {
			if (!file.filename || !file.data) {
				logger.warn("Skipping invalid file", { file })
				continue
			}

			try {
				const buffer = Buffer.from(file.data, "base64")
				const filePath = path.join(uploadDir, file.filename)

				await fs.writeFile(filePath, buffer)

				uploadedFiles.push({
					filename: file.filename,
					size: buffer.length,
					path: filePath,
				})

				logger.info("File uploaded", {
					userId,
					simId,
					filename: file.filename,
					size: buffer.length,
				})
			} catch (fileError) {
				logger.error("Error processing file", {
					filename: file.filename,
					error: fileError,
				})
				throw new Error(`Failed to process file: ${file.filename}`)
			}
		}

		if (uploadedFiles.length === 0) {
			return {
				status: 400,
				body: { error: "No valid files were uploaded" },
			}
		}

		await emit({
			topic: "filesUploaded",
			data: { userId, simId },
		})

		return {
			status: 200,
			body: {
				message: `${uploadedFiles.length} file(s) uploaded successfully`,
				uploadDir,
				files: uploadedFiles,
			},
		}
	} catch (error) {
		logger.error("Error uploading files:", error)
		return {
			status: 500,
			body: {
				error: "Failed to upload files",
				details: error instanceof Error ? error.message : "Unknown error",
			},
		}
	}
}
