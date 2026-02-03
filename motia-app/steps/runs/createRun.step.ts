import crypto from "crypto"
import { ApiRouteConfig, Handlers } from "motia"
import { nanoid } from "nanoid"
import { mkdir, rm } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"
import { db } from "../../src/lib/db"

const CreateRunInputSchema = z.object({
	userId: z.uuid(),
	jobId: z.uuid(),
})

export const config: ApiRouteConfig = {
	name: "Create Run",
	type: "api",
	path: "/api/create-run",
	bodySchema: CreateRunInputSchema,
	method: "POST",
	emits: [],
	flows: ["Runs Management"],
}

export const handler: Handlers["Create Run"] = async (
	req: any,
	{ logger }: any,
) => {
	const { userId, jobId } = req.body

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
	const jobFolder = `${job.name.replace(/\s+/g, "_").toLowerCase()}-${job.folderId}`
	const runName = job.name
	const runFolderId = nanoid(7)
	const runFolder = `${runName.replace(/\s+/g, "_").toLowerCase()}-${runFolderId}`

	// Construimos la ruta
	const runStoragePath = join(
		STORAGE_PATH_BASE,
		userId,
		"jobs",
		jobFolder,
		"runs",
		runFolder,
	)

	let folderCreated = false

	try {
		// 1. Crear carpeta física
		await mkdir(runStoragePath, { recursive: true })
		folderCreated = true

		// 2. Insertar en DB
		try {
			await db
				.insertInto("Run")
				.values({
					id: crypto.randomUUID(),
					createdAt: new Date(),
					updatedAt: new Date(),
					runName: runName,
					runFolderId: runFolderId,
					jobId: jobId,
					userId: userId,
				})
				.execute()
		} catch (dbError) {
			// ROLLBACK: Si la DB falla, borramos la carpeta recién creada
			if (folderCreated) {
				logger.warn("DB insertion failed, removing created directory", {
					runStoragePath,
				})
				await rm(runStoragePath, { recursive: true, force: true })
			}
			throw dbError // Re-lanzamos para el catch principal
		}

		return {
			status: 201, // 201 es más correcto para "Created"
			body: { success: true, message: "Run created successfully", runFolderId },
		}
	} catch (error: any) {
		logger.error("Error creating run:", error)
		return {
			status: 500,
			body: { success: false, message: "Internal server error" },
		}
	}
}
