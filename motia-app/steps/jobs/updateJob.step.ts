import fs from "fs/promises"
import { ApiRouteConfig, Handlers } from "motia"
import { join } from "node:path"
import { z } from "zod"
import { db } from "../../src/lib/db"

const UpdateJobInputSchema = z.object({
	userId: z.uuid(),
	jobId: z.uuid(),
	name: z.string().min(1),
	description: z.string().optional(),
})

export const config: ApiRouteConfig = {
	name: "Update Job",
	type: "api",
	path: "/api/update-job",
	bodySchema: UpdateJobInputSchema,
	method: "POST",
	emits: [],
	flows: ["Jobs Management"],
}

export const handler: Handlers["Update Job"] = async (
	req: any,
	{ logger }: any,
) => {
	const { userId, jobId, name, description } = req.body

	const job = await db
		.selectFrom("Job")
		.where("id", "=", jobId)
		.selectAll()
		.executeTakeFirst()

	if (!job) {
		return { status: 404, body: { success: false, message: "Job not found" } }
	}

	const STORAGE_PATH_BASE = process.env.STORAGE_PATH_BASE
	if (!STORAGE_PATH_BASE) {
		logger.error("Missing STORAGE_PATH_BASE")
		return {
			status: 500,
			body: { success: false, message: "Server configuration error" },
		}
	}

	// Helper para consistencia de nombres
	const formatFolderName = (name: string, id: string) =>
		`${name.replace(/\s+/g, "_").toLowerCase()}-${id}`

	const currentPath = join(
		STORAGE_PATH_BASE,
		userId,
		"jobs",
		formatFolderName(job.name, job.folderId),
	)
	const newPath = join(
		STORAGE_PATH_BASE,
		userId,
		"jobs",
		formatFolderName(name, job.folderId),
	)

	try {
		let folderWasRenamed = false

		if (job.name !== name) {
			try {
				await fs.access(newPath)
				return {
					status: 409,
					body: {
						success: false,
						message: "A folder with this name already exists.",
					},
				}
			} catch (e: any) {
				if (e.code !== "ENOENT") throw e
			}

			// Rename only if source exists
			try {
				await fs.access(currentPath)
				await fs.rename(currentPath, newPath)
				folderWasRenamed = true
			} catch (e: any) {
				if (e.code !== "ENOENT") throw e
			}
		}

		try {
			const updatedJob = await db
				.updateTable("Job")
				.set({
					updatedAt: new Date(),
					name: name,
					description: description || null,
				})
				.where("id", "=", jobId)
				.where("userId", "=", userId)
				.returning(["id", "name", "description", "folderId"])
				.executeTakeFirst()

			return {
				status: 200,
				body: {
					success: true,
					message: "Job updated successfully",
					job: updatedJob,
				},
			}
		} catch (dbError) {
			if (folderWasRenamed) {
				logger.warn("DB failed. Rolling back folder name...")
				await fs.rename(newPath, currentPath)
			}
			throw dbError
		}
	} catch (error: any) {
		// Loguea el error completo para debugging
		logger.error("Error:", error)

		return {
			status: 500,
			body: {
				success: false,
				message: "An error occurred while updating the job",
			},
		}
	}
}
