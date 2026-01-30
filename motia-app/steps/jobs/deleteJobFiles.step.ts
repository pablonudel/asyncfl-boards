import { ApiRouteConfig, Handlers } from "motia"
import { access, unlink } from "node:fs/promises"
import { basename, join } from "node:path"
import { z } from "zod"
import { db } from "../../src/lib/db"

const DeleteJobFilesSchema = z.object({
	userId: z.uuid(),
	fileName: z.string().min(1),
	folderId: z.string().min(1),
	fileType: z.enum(["sourceFiles", "reqFile"]),
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
	const { userId, fileName, folderId, fileType } = req.body

	// Validate environment variables
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

	const safeFileName = basename(fileName)

	try {
		// 1. Obtener el Job y validar existencia
		const job = await db
			.selectFrom("Job")
			.where("folderId", "=", folderId)
			.select(["id", "status", "sourceFiles", "reqFile"])
			.executeTakeFirst()

		if (!job) {
			return { status: 404, body: { success: false, message: "Job not found" } }
		}

		// 2. Verificar si hay Runs activos
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
					message: "Cannot delete files with active runs",
				},
			}
		}

		// 3. Determinar ruta del archivo
		const pathMap = {
			sourceFiles: join(
				STORAGE_PATH_BASE,
				userId,
				"jobs",
				folderId,
				"source",
				safeFileName,
			),
			datasetsFiles: join(STORAGE_PATH_BASE, userId, "datasets", safeFileName),
			reqFile: join(STORAGE_PATH_BASE, userId, "jobs", folderId, safeFileName),
		}
		const storagePath = pathMap[fileType as keyof typeof pathMap]

		// 4. Borrar archivo físico (Verificar primero si existe para evitar que el proceso explote)
		try {
			await access(storagePath)
			await unlink(storagePath)
		} catch (e: any) {
			logger.warn(
				`File not found on disk, but proceeding to clean DB: ${storagePath}`,
			)
		}

		// 5. Actualizar DB
		if (fileType === "reqFile") {
			await db
				.updateTable("Job")
				.set({ reqFile: null })
				.where("id", "=", job.id)
				.execute()
		} else {
			// Tipado dinámico seguro
			const currentList = (job[fileType as "sourceFiles"] || []) as string[]
			const updatedFiles = currentList.filter((f) => f !== fileName)

			await db
				.updateTable("Job")
				.set({ [fileType]: updatedFiles })
				.where("id", "=", job.id)
				.execute()
		}

		// 6. Recalcular estado del Job
		const updatedJob = await db
			.selectFrom("Job")
			.where("id", "=", job.id)
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
