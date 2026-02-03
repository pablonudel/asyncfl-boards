import crypto from "crypto"
import { ApiRouteConfig, Handlers } from "motia"
import { nanoid } from "nanoid"
import { mkdir, rm } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"
import { db } from "../../src/lib/db"

const CreateJobInputSchema = z.object({
	userId: z.uuid(),
	name: z.string().min(1).max(100),
	description: z.string().optional(),
})

export const config: ApiRouteConfig = {
	name: "Create Job",
	type: "api",
	path: "/api/create-job",
	bodySchema: CreateJobInputSchema,
	method: "POST",
	emits: [],
	flows: ["Jobs Management"],
}

export const handler: Handlers["Create Job"] = async (
	req: any,
	{ logger }: any,
) => {
	const { userId, name, description } = req.body
	const STORAGE_PATH_BASE = process.env.STORAGE_PATH_BASE

	if (!STORAGE_PATH_BASE) {
		logger.error("STORAGE_PATH_BASE is not defined")
		return {
			status: 500,
			body: {
				success: false,
				message: "env configuration is missing",
			},
		}
	}

	// 1. Preparar identificadores antes de tocar nada
	const jobId = crypto.randomUUID()
	const folderId = nanoid(7)
	const folderName = `${name.replace(/\s+/g, "_").toLowerCase()}-${folderId}`
	const storagePath = join(STORAGE_PATH_BASE, userId, "jobs", folderName)

	let folderCreated = false

	try {
		// 2. Intentar crear la carpeta física PRIMERO
		await mkdir(storagePath, { recursive: true })
		folderCreated = true

		// 3. Insertar en la Base de Datos
		try {
			const newJob = await db
				.insertInto("Job")
				.values({
					id: jobId,
					createdAt: new Date(),
					updatedAt: new Date(),
					folderId: folderId,
					name: name,
					description: description || null,
					userId: userId,
					sourceFiles: [],
					status: "CREATED",
				})
				.returning(["id", "name", "folderId"])
				.executeTakeFirstOrThrow() // Usar Throw para ir directo al catch si falla

			return {
				status: 201, // Created
				body: {
					success: true,
					message: "Job created successfully",
					job: newJob,
				},
			}
		} catch (dbError) {
			// Si la DB falla, borramos la carpeta para no dejar "huérfanos"
			if (folderCreated) {
				logger.warn(
					`DB failed to create Job ${jobId}. Cleaning up directory: ${storagePath}`,
				)
				await rm(storagePath, { recursive: true, force: true })
			}
			throw dbError
		}
	} catch (error: any) {
		logger.error("Create Job Error:", error)
		return {
			status: 500,
			body: {
				success: false,
				message: "Failed to create job",
				error:
					process.env.NODE_ENV === "development" ? error.message : undefined,
			},
		}
	}
}
