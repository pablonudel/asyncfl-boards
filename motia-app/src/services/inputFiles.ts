import { randomUUID } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"
import { z } from "zod"
import { db } from "../lib/db"

const UploadFilesSchema = z.object({
	userId: z.string(),
	simId: z.string(),
	files: z.array(
		z.object({
			fileName: z.string(),
			contentType: z.string(),
			data: z.string(), // Base64 encoded
		})
	),
})

function getInputFilesDir(userId: string, simId: string) {
	const SIMFILES_BASE_DIR =
		process.env.SIMFILES_BASE_DIR ||
		path.resolve(process.cwd(), "..", "data", "simfiles")

	return path.join(SIMFILES_BASE_DIR, userId, simId, "input-files")
}

export async function uploadInputFiles({
	userId,
	simId,
	files,
}: z.infer<typeof UploadFilesSchema>) {
	const uploadDir = getInputFilesDir(userId, simId)

	// Create directory if it doesn't exist
	await fs.mkdir(uploadDir, { recursive: true })

	const uploadedFiles: {
		fileName: string
		size: number
		type: string
	}[] = []

	for (const file of files) {
		if (!file.fileName || !file.data) {
			continue
		}

		try {
			const buffer = Buffer.from(file.data, "base64")
			const filePath = path.join(uploadDir, file.fileName)
			const fileType = file.contentType || "application/octet-stream"

			await fs.writeFile(filePath, buffer)

			uploadedFiles.push({
				fileName: file.fileName,
				size: buffer.length,
				type: fileType,
			})
		} catch (error) {
			throw new Error(
				`Failed to process file ${file.fileName}: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			)
		}
	}

	if (uploadedFiles.length === 0) {
		return {
			success: false,
			status: 400,
			message: "No valid files were uploaded",
		}
	}

	return {
		success: true,
		status: 200,
		uploadedFiles,
		message: "Files uploaded successfully",
	}
}

export async function createFileEntries(
	simId: string,
	uploadedFiles: { fileName: string; size: number; type: string }[]
) {
	const inFilesValues = uploadedFiles.map((file) => ({
		id: randomUUID(),
		simulationId: simId,
		fileName: file.fileName,
		fileSize: file.size,
		fileType: file.type,
		createdAt: new Date(),
		updatedAt: new Date(),
	}))

	try {
		await db.insertInto("in_files").values(inFilesValues).execute()

		return {
			success: true,
			message: `${uploadedFiles.length} file(s) uploaded successfully`,
		}
	} catch (error) {
		throw new Error(
			`Failed to create file entries in database: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		)
	}
}
