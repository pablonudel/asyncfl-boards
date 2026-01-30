import { ApiRouteConfig, Handlers } from "motia"
import { nanoid } from "nanoid"
import { mkdir } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"
import { db } from "../../src/lib/db"

const CreateJobInputSchema = z.object({
	userId: z.uuid(),
	userName: z.string().min(1),
	userPassword: z.string().min(8),
	name: z.string().min(1),
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
	const { userId, userName, userPassword, name, description } = req.body
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
		// const { client }: any = await sshManager.getSession(
		// 	userId,
		// 	userName,
		// 	userPassword,
		// )

		const newJob = await db
			.insertInto("Job")
			.values({
				id: crypto.randomUUID(),
				createdAt: new Date(),
				updatedAt: new Date(),
				folderId: nanoid(7),
				name: name,
				description: description || null,
				userId: userId,
				sourceFiles: [],
				datasetsFiles: [],
				reqFile: null,
			})
			.returning(["id", "name", "folderId"])
			.executeTakeFirst()

		// const jobPath = `${TARGET_PATH_BASE}/${userName}/jobs/${newJob?.folderId}`
		// await sshManager.runCommand(client, `mkdir -p ${jobPath}`)

		const storagePath = join(
			STORAGE_PATH_BASE,
			userId,
			"jobs",
			newJob!.folderId,
		)
		await mkdir(storagePath, { recursive: true })

		return {
			status: 200,
			body: { success: true, message: "Job created successfully", job: newJob },
		}
	} catch (error: any) {
		// Loguea el error completo para debugging
		logger.error("Error:", error)
		console.error("Complete error:", error)

		return {
			status: 500,
			body: {
				success: false,
				message: "Failed to create job",
				error: error instanceof Error ? error.message : String(error),
			},
		}
	}
}
