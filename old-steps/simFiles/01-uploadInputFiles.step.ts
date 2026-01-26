import { ApiRouteConfig, Handlers } from "motia"
import { z } from "zod"
import {
	createFileEntries,
	uploadInputFiles,
} from "../../src/services/inputFiles"

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

export const config: ApiRouteConfig = {
	type: "api",
	name: "UploadInputFiles",
	description: "Upload input files for a simulation",
	path: "/simulations/upload-files",
	method: "POST",
	bodySchema: UploadFilesSchema,
	emits: ["files.uploaded"],
	flows: ["simFiles"],
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

		const uploadResult = await uploadInputFiles({ userId, simId, files })
		if (!uploadResult.success || !uploadResult.uploadedFiles) {
			return {
				status: uploadResult.status,
				body: { error: uploadResult.message },
			}
		}

		const createEntriesResult = await createFileEntries(
			simId,
			uploadResult.uploadedFiles
		)

		await emit({
			topic: "files.uploaded",
			data: {
				success: createEntriesResult.success,
				simId,
				uploadedFiles: uploadResult.uploadedFiles,
			},
		})

		return {
			status: uploadResult.status,
			body: { message: createEntriesResult.message },
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
