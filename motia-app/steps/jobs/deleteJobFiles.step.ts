import { ApiRouteConfig, Handlers } from "motia"
import { unlink } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"
import { db } from "../../src/lib/db"

const DeleteJobFilesSchema = z.object({
	userId: z.uuid(),
	fileName: z.string().min(1),
	folderId: z.string().min(1),
	fileType: z.enum(["sourceFiles", "datasetsFiles", "reqFile"]),
})

export const config: ApiRouteConfig = {
	name: "Delete Job Files",
	type: "api",
	path: "/api/delete-job-files",
	bodySchema: DeleteJobFilesSchema,
	method: "POST",
	emits: [],
	flows: ["Jobs Management"],
}

export const handler: Handlers["Delete Job Files"] = async (
	req: any,
	{ logger }: any,
) => {
	// Extract input data
	const { userId, userName, userPassword, fileName, folderId, fileType } =
		req.body

	// Validate environment variables
	// const TARGET_PATH_BASE = process.env.TARGET_PATH_BASE
	const STORAGE_PATH_BASE = process.env.STORAGE_PATH_BASE

	if (!STORAGE_PATH_BASE) {
		return {
			status: 500,
			body: {
				success: false,
				message: "env configuration is missing",
			},
		}
	}

	try {
		// Get SSH session
		// const { client }: any = await sshManager.getSession(
		// 	userId,
		// 	userName,
		// 	userPassword,
		// )

		// Determine paths
		let storagePath: string = ""
		// let targetPath: string = ""
		if (fileType === "sourceFiles") {
			storagePath = join(
				STORAGE_PATH_BASE,
				userId,
				"jobs",
				folderId,
				"source",
				fileName,
			)
			// targetPath = `${TARGET_PATH_BASE}/${userName}/jobs/${folderId}/source/${fileName}`
		} else if (fileType === "datasetsFiles") {
			storagePath = join(STORAGE_PATH_BASE, userId, "datasets", fileName)
			// targetPath = `/datasets/${userName}/${fileName}`
		} else {
			storagePath = join(STORAGE_PATH_BASE, userId, "jobs", folderId, fileName)
			// targetPath = `${TARGET_PATH_BASE}/${userName}/jobs/${folderId}/${fileName}`
		}

		const job = await db
			.selectFrom("Job")
			.where("folderId", "=", folderId)
			.select([fileType, "status", "id"])
			.executeTakeFirst()

		if (!job) {
			return {
				status: 404,
				body: {
					success: false,
					message: "Job not found",
				},
			}
		}

		// search if any run is using this job is active
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
						"Cannot delete file while there are active runs using this job",
				},
			}
		}

		// Delete file from remote server
		// await sshManager.runCommand(client, `rm -f ${targetPath}`)
		// Delete file from local storage
		await unlink(storagePath)

		// Update database record
		if (job) {
			if (fileType === "reqFile") {
				await db
					.updateTable("Job")
					.set({ reqFile: null })
					.where("folderId", "=", folderId)
					.executeTakeFirst()
			} else {
				const updatedFiles = (job as any)[fileType].filter(
					(f: string) => f !== fileName,
				)

				await db
					.updateTable("Job")
					.set({ [fileType]: updatedFiles })
					.where("folderId", "=", folderId)
					.executeTakeFirst()
			}
		}

		const updatedJob = await db
			.selectFrom("Job")
			.where("folderId", "=", folderId)
			.select(["sourceFiles", "reqFile"])
			.executeTakeFirst()

		if (!updatedJob?.reqFile || updatedJob.sourceFiles.length === 0) {
			await db
				.updateTable("Job")
				.set({ status: "CREATED" })
				.where("folderId", "=", folderId)
				.executeTakeFirst()
		}

		return {
			status: 200,
			body: {
				success: true,
				message: "File deleted successfully",
			},
		}
	} catch (error) {
		// Loguea el error completo para debugging
		logger.error("Error:", error)
		console.error("Complete error:", error)

		return {
			status: 500,
			body: {
				success: false,
				message: "An error occurred while deleting the file",
			},
		}
	}
}
