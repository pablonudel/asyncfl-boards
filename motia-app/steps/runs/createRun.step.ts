import { ApiRouteConfig, Handlers } from "motia"
import { nanoid } from "nanoid"
import { mkdir } from "node:fs/promises"
import { join } from "node:path"
import { z } from "zod"
import { sshManager } from "../../src/lib/sshManager"

const JsonStringSchema = z.string().refine(
	(val) => {
		try {
			JSON.parse(val)
			return true
		} catch (e) {
			return false
		}
	},
	{ message: "Invalid JSON string" },
)

const CreateRunInputSchema = z.object({
	userId: z.uuid(),
	userName: z.string().min(1),
	userPassword: z.string().min(8),
	jobId: z.uuid(),
	folderId: z.string().min(1),
	runName: z.string().min(1),
	entryFile: z.string().min(1),
	paramsConfig: JsonStringSchema.optional(),
	sbatchConfig: JsonStringSchema.optional(),
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
	const {
		userId,
		userName,
		userPassword,
		jobId,
		folderId,
		runName,
		entryFile,
		paramsConfig,
		sbatchConfig,
	} = req.body

	const runFolderId = `${runName.replace(/\s+/g, "_")}-${nanoid(7)}`
	const TARGET_PATH_BASE = process.env.TARGET_PATH_BASE
	const STORAGE_PATH_BASE = process.env.STORAGE_PATH_BASE

	if (!TARGET_PATH_BASE || !STORAGE_PATH_BASE) {
		return {
			status: 500,
			body: {
				success: false,
				message: "env configuration is missing",
			},
		}
	}

	try {
		const { client }: any = await sshManager.getSession(
			userId,
			userName,
			userPassword,
		)

		// Create run directory in storage
		const runStoragePath = join(
			STORAGE_PATH_BASE,
			userId,
			"jobs",
			folderId,
			"runs",
			runFolderId,
		)
		await mkdir(runStoragePath, { recursive: true })

		// Create run directory on target via SSH
		const runTargetPath = `${TARGET_PATH_BASE}/${userName}/jobs/${folderId}/runs/${runFolderId}`
		await sshManager.runCommand(client, `mkdir -p ${runTargetPath}`)

		// Insert new run record in the database
	} catch (error) {}
}
