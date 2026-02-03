import fs from "fs/promises"
import { ApiRouteConfig, Handlers } from "motia"
import { join } from "node:path"
import { z } from "zod"
import { db } from "../../src/lib/db"

const UpdateRunInputSchema = z.object({
	userId: z.uuid(),
	runId: z.uuid(),
	runName: z.string().min(1),
	entryFile: z.string().min(1).optional(),
	paramsConfig: z.record(z.string(), z.any()).optional(),
	sbatchConfig: z.record(z.string(), z.any()).optional(),
	pythonVersion: z.number().optional(),
	datasetsFiles: z.array(z.string()).optional(),
})

export const config: ApiRouteConfig = {
	name: "Update Run",
	type: "api",
	path: "/api/update-run",
	bodySchema: UpdateRunInputSchema,
	method: "POST",
	emits: [],
	flows: ["Runs Management"],
}

export const handler: Handlers["Update Run"] = async (
	req: any,
	{ logger }: any,
) => {
	const {
		userId,
		runId,
		runName,
		entryFile,
		paramsConfig,
		sbatchConfig,
		pythonVersion,
		datasetsFiles,
	} = req.body

	const run = await db
		.selectFrom("Run")
		.where("id", "=", runId)
		.selectAll()
		.executeTakeFirst()

	if (!run) {
		return { status: 404, body: { success: false, message: "Run not found" } }
	}

	const job = await db
		.selectFrom("Job")
		.where("id", "=", run.jobId)
		.select(["name", "folderId", "environmentId"])
		.executeTakeFirst()

	if (!job) {
		return { status: 404, body: { success: false, message: "Job not found" } }
	}

	const STORAGE_PATH_BASE = process.env.STORAGE_PATH_BASE
	if (!STORAGE_PATH_BASE) {
		logger.error("Missing STORAGE_PATH_BASE env var")
		return {
			status: 500,
			body: { success: false, message: "Server config missing" },
		}
	}

	const jobFolder = `${job.name.replace(/\s+/g, "_").toLowerCase()}-${job.folderId}`
	// Helper para consistencia de nombres
	const formatFolderName = (name: string, id: string) =>
		`${name.replace(/\s+/g, "_").toLowerCase()}-${id}`

	const currentPath = join(
		STORAGE_PATH_BASE,
		userId,
		"jobs",
		jobFolder,
		"runs",
		formatFolderName(run.runName, run.runFolderId),
	)
	const newPath = join(
		STORAGE_PATH_BASE,
		userId,
		"jobs",
		jobFolder,
		"runs",
		formatFolderName(runName, run.runFolderId),
	)

	try {
		let folderWasRenamed = false

		// 1. LÓGICA DE RENOMBRADO
		if (runName !== run.runName) {
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

			await fs.rename(currentPath, newPath)
			folderWasRenamed = true
		}

		// 2. LÓGICA DE BASE DE DATOS
		try {
			await db
				.updateTable("Run")
				.set({
					runName,
					updatedAt: new Date(),
					entryFile: entryFile ?? run.entryFile,
					paramsConfig: paramsConfig ?? run.paramsConfig,
					sbatchConfig: sbatchConfig ?? run.sbatchConfig,
					pythonVersion: pythonVersion ?? run.pythonVersion,
					datasetsFiles: datasetsFiles ?? run.datasetsFiles,
					environmentId: job.environmentId,
				})
				.where("id", "=", runId)
				.execute()
		} catch (dbError) {
			if (folderWasRenamed) {
				logger.warn("DB failed. Rolling back folder name...")
				await fs.rename(newPath, currentPath)
			}
			throw dbError
		}

		return { status: 200, body: { success: true, message: "Run updated" } }
	} catch (error: any) {
		logger.error("Error updating run:", error)
		return {
			status: 500,
			body: {
				success: false,
				message:
					error.code === "ENOENT"
						? "Original folder not found"
						: "Error updating run",
			},
		}
	}
}
