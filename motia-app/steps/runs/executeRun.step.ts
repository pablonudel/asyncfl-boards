import { ApiRouteConfig, Handlers } from "motia"
import { z } from "zod"
import { db } from "../../src/lib/db"

const ExecuteRunInputSchema = z.object({
	userId: z.uuid(),
	runId: z.uuid(),
	userName: z.string().min(1),
	userPassword: z.string().min(1),
})

export const config: ApiRouteConfig = {
	name: "Execute Run",
	type: "api",
	path: "/api/execute-run",
	bodySchema: ExecuteRunInputSchema,
	method: "POST",
	emits: ["Run Config Checked"],
	flows: ["Runs Management"],
}

export const handler: Handlers["Execute Run"] = async (
	req: any,
	{ emit, logger }: any,
) => {
	const { userId, runId, userName, userPassword } = req.body
	const TARGET_PATH_BASE = process.env.TARGET_PATH_BASE
	if (!TARGET_PATH_BASE) {
		logger.error("Missing TARGET_PATH_BASE")
		return {
			status: 500,
			body: { success: false, message: "Server configuration error" },
		}
	}

	// General validations
	const run = await db
		.selectFrom("Run")
		.where("id", "=", runId)
		.selectAll()
		.executeTakeFirst()

	if (!run)
		return { status: 404, body: { success: false, message: "Run not found" } }

	const environment = await db
		.selectFrom("Environment")
		.where("id", "=", run.environmentId)
		.select(["hashedReqs"])
		.executeTakeFirst()

	if (!environment) {
		return {
			status: 404,
			body: { success: false, message: "Environment not found" },
		}
	}

	const job = await db
		.selectFrom("Job")
		.where("id", "=", run.jobId)
		.selectAll()
		.executeTakeFirst()

	if (!job)
		return { status: 404, body: { success: false, message: "Job not found" } }

	if (job.status !== "READY") {
		return {
			status: 400,
			body: { success: false, message: "Job is not ready for execution" },
		}
	}

	if (!run.entryFile || !run.pythonVersion) {
		return {
			status: 400,
			body: {
				success: false,
				message: "Run is missing entry file or python version",
			},
		}
	}

	const runSnapshot = {
		pythonVersion: run.pythonVersion,
		entryFile: run.entryFile,
		sourceFiles: job.sourceFiles,
		datasetsFiles: run.datasetsFiles,
	}

	const jobFolder = `${job.name.replace(/\s+/g, "_").toLowerCase()}-${job.folderId}`
	const runFolder = `${run.runName.replace(/\s+/g, "_").toLowerCase()}-${run.runFolderId}`
	const runPath = `${TARGET_PATH_BASE}/${userName}/jobs/${job.folderId}/runs/${runFolder}`
	const outputPath = `${runPath}/output_files`
	const logPath = `${runPath}/logs`
	const envPath = `${TARGET_PATH_BASE}/${userName}/shared_envs/env_${environment.hashedReqs}`

	const finalParamsConfig = {
		...((run.paramsConfig as Record<string, any>) || {}),
		outputDir: `${outputPath}`,
	}

	const finalSbatchConfig = {
		...((run.sbatchConfig as Record<string, any>) || {}),
		jobName: run.runName,
		mailType: "ALL",
		output: `${logPath}/stdout.txt`,
		error: `${logPath}/stderr.txt`,
		chdir: runPath,
	}

	try {
		await db
			.updateTable("Run")
			.set({
				runSnapshot: JSON.stringify(runSnapshot),
				status: "PREPARING",
				paramsConfig: JSON.stringify(finalParamsConfig),
				sbatchConfig: JSON.stringify(finalSbatchConfig),
			})
			.where("id", "=", runId)
			.execute()
	} catch (error) {
		logger.error("Error updating run snapshot:", error)
		return {
			status: 500,
			body: { success: false, message: "Failed to update Run Configs" },
		}
	}

	await emit({
		topic: "Run Config Checked",
		data: {
			// 1. Credenciales y Contexto
			userId,
			userName,
			userPassword,

			// 2. IDs de Referencia
			runId,
			jobId: job.id, // Útil para logs en el worker
			jobFolder, // ID de la carpeta del Job
			runFolder, // ID de la carpeta del Run

			// 3. Configuraciones Finales (Ya fusionadas con output_dir, etc.)
			paramsConfig: finalParamsConfig,
			sbatchConfig: finalSbatchConfig,

			// 4. Datos de Ejecución
			entryFile: run.entryFile,
			pythonVersion: run.pythonVersion,

			// 5. Rutas Maestras (Absolutas para Slurm)
			// El worker las usará para hacer mkdir -p
			runPath: runPath, // ej: /home/user/jobs/uuid/runs/uuid
			codePath: `${runPath}/source`,
			outputPath: `${outputPath}`,
			logPath: `${logPath}`,

			// 6. Inventario de Archivos (Snapshot)
			// El worker usará esto para saber qué archivos meter en el .tar.gz
			sourceFiles: job.sourceFiles,
			datasetsFiles: run.datasetsFiles,

			// 7. Entorno
			// El path al venv que debe activar el sbatch
			venvPath: envPath,
		},
	})

	return {
		status: 200,
		body: { success: true, message: "Preparing run execution" },
	}
}
