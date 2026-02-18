import { updateJobStatus, updateUserJob } from "@/actions/slurm/job.actions"
import { getUserJobById } from "@/data/jobData"
import { prisma } from "@/lib/prisma"
import { readNpyFile } from "@/lib/readFiles"
import crypto from "crypto"
import { promises as fs } from "fs"
import { nanoid } from "nanoid"
import { NextRequest, NextResponse } from "next/server"
import { basename, join } from "path"

const STORAGE_PATH_BASE = process.env.STORAGE_PATH_BASE!

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData()

		// Extraemos los campos y el archivo
		const file = formData.get("file") as File | null
		const userId = formData.get("userId") as string | null
		const fileType = formData.get("fileType") as string | null
		const jobId = formData.get("jobId") as string | null
		const readmeContent = formData.get("readmeContent") as string | null

		if (!file) {
			return NextResponse.json(
				{ success: false, message: "No file provided" },
				{ status: 400 },
			)
		}

		if (!fileType || !userId) {
			return NextResponse.json(
				{ success: false, message: "Missing required fields" },
				{ status: 400 },
			)
		}

		// Convertimos el archivo a Buffer (equivalente a file.buffer de multer)
		const arrayBuffer = await file.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)

		// --- 1. LÓGICA ESPECÍFICA PARA DATASETS ---
		if (fileType === "datasetFile") {
			if (!readmeContent?.trim()) {
				return NextResponse.json(
					{
						success: false,
						message: "readmeContent is required for datasets",
					},
					{ status: 400 },
				)
			}

			const safeFileName = basename(file.name)

			const dataset = await prisma.dataset.findFirst({
				where: {
					fileName: safeFileName,
					userId: userId,
				},
				select: { id: true },
			})

			if (dataset) {
				return NextResponse.json(
					{
						status: "error",
						message: "A dataset with this file name already exists",
					},
					{ status: 400 },
				)
			}

			const user = await prisma.user.findUnique({
				where: { id: userId },
				select: { email: true },
			})

			if (!user) {
				return NextResponse.json(
					{ success: false, message: "User not found" },
					{ status: 404 },
				)
			}

			const newFolderId = `${safeFileName.split(".")[0].replace(/\s+/g, "_").toLowerCase()}-${nanoid(7)}`
			const datasetDir = join(
				STORAGE_PATH_BASE,
				userId,
				"datasets",
				newFolderId,
			)

			try {
				await fs.mkdir(datasetDir, { recursive: true })
				const readmeFileContent = `# Dataset Readme\n\nFile: ${safeFileName}\nContact: ${user?.email}\n\n## Description\n${readmeContent}`

				await fs.writeFile(
					join(datasetDir, "README.md"),
					readmeFileContent,
					"utf-8",
				)
				await fs.writeFile(join(datasetDir, safeFileName), buffer)

				try {
					await prisma.dataset.create({
						data: {
							fileName: safeFileName,
							folderId: newFolderId,
							userId: userId,
							readmeContent: readmeContent,
						},
					})

					return NextResponse.json({
						status: "success",
						message: "Dataset uploaded",
					})
				} catch (error) {
					console.error("Error creating dataset in DB:", error)
					return NextResponse.json(
						{ status: "error", message: "Failed to create dataset in DB" },
						{ status: 500 },
					)
				}
			} catch (error) {
				console.error("Error creating dataset directory:", error)
				return NextResponse.json(
					{ status: "error", message: "Failed to create dataset directory" },
					{ status: 500 },
				)
			}
		}

		// --- 2. LÓGICA PARA SOURCE FILES y REQUIREMENTS ---
		if (fileType === "sourceFile" || fileType === "requirementsFile") {
			if (!jobId) {
				return NextResponse.json(
					{
						success: false,
						message: "jobId is required for source and requirements files",
					},
					{ status: 400 },
				)
			}
			try {
				const { success, message, job } = await getUserJobById(userId, jobId)

				if (!success || !job) {
					return NextResponse.json(
						{ success: false, message: message },
						{ status: 404 },
					)
				}

				// Bloqueo si hay Runs activos
				const activeRun = await prisma.run.findFirst({
					where: {
						jobId: job.id,
						status: { in: ["PREPARING", "QUEUED", "RUNNING"] },
					},
					select: { id: true },
				})

				if (activeRun) {
					return NextResponse.json(
						{
							success: false,
							message:
								"Cannot upload files while there are active runs for this job",
						},
						{ status: 400 },
					)
				}

				const folderName = `${job.name.replace(/\s+/g, "_").toLowerCase()}-${job.folderId}`
				const isSource = fileType === "sourceFile"
				const targetDir = isSource
					? join(STORAGE_PATH_BASE, userId, "jobs", folderName, "source")
					: join(STORAGE_PATH_BASE, userId, "jobs", folderName)

				await fs.mkdir(targetDir, { recursive: true })
				const safeName = basename(file.name)
				await fs.writeFile(join(targetDir, safeName), buffer)

				if (isSource) {
					const currentFiles = (job.sourceFiles as string[]) || []
					const updated = [...new Set([...currentFiles, safeName])]
					const { success, message, updatedJob } = await updateUserJob(
						userId,
						job.id,
						{
							sourceFiles: updated,
						},
					)
					if (!success || !updatedJob) {
						return NextResponse.json(
							{ success: false, message: message },
							{ status: 500 },
						)
					}

					const isForReadyStatus =
						updatedJob.environmentId &&
						updatedJob.sourceFiles &&
						updatedJob.sourceFiles.length > 0
					if (isForReadyStatus) await updateJobStatus(userId, job.id, "READY")
				} else {
					const rawEnv = buffer.toString("utf-8")
					const normalized = rawEnv
						.split("\n")
						.map((l) => l.trim())
						.filter((l) => l)
						.sort()
						.join("\n")

					const hash = crypto
						.createHash("sha256")
						.update(normalized)
						.digest("hex")

					const envExists = await prisma.environment.findFirst({
						where: { hashedReqs: hash },
						select: { id: true },
					})

					if (!envExists) {
						const newEnv = await prisma.environment.create({
							data: {
								requirementsContent: rawEnv,
								hashedReqs: hash,
								userId: userId,
							},
						})

						const { success, message, updatedJob } = await updateUserJob(
							userId,
							job.id,
							{
								environmentId: newEnv.id,
							},
						)
						if (!success || !updatedJob) {
							return NextResponse.json(
								{ success: false, message: message },
								{ status: 500 },
							)
						}

						const isForReadyStatus =
							updatedJob.environmentId &&
							updatedJob.sourceFiles &&
							updatedJob.sourceFiles.length > 0
						if (isForReadyStatus) await updateJobStatus(userId, job.id, "READY")
					}
				}
				return NextResponse.json({
					success: true,
					message: `${isSource ? "Source" : "Requirements"} file uploaded successfully`,
				})
			} catch (error) {
				console.error("Error handling source/requirements file:", error)
				return NextResponse.json(
					{ success: false, message: "Error processing file upload" },
					{ status: 500 },
				)
			}
		}

		// --- 3. LÓGICA PARA RESULTS FILES ---
		if (fileType === "resultsFile") {
			const targetDir = join(STORAGE_PATH_BASE, userId, "files")
			await fs.mkdir(targetDir, { recursive: true })

			const safeName = basename(file.name)
			const filePath = join(targetDir, safeName)

			try {
				await fs.writeFile(filePath, buffer)
			} catch (error) {
				console.error("Error writing file:", error)
				return NextResponse.json(
					{ success: false, message: "File write error" },
					{ status: 500 },
				)
			}

			let shape = null
			try {
				shape = (await readNpyFile(userId, safeName)).shape
			} catch (error) {
				console.error("Error reading file shape:", error)
				return NextResponse.json(
					{ success: false, message: "File read error" },
					{ status: 500 },
				)
			}

			return NextResponse.json({
				success: true,
				message: `Results file ${safeName} uploaded successfully`,
				file: {
					fileName: safeName,
					fileSize: file.size,
					fileShape: shape,
				},
			})
		}

		// --- 4. LÓGICA PARA AVATAR ---
		if (fileType === "avatarFile") {
			const targetDir = join(STORAGE_PATH_BASE, userId)
			await fs.mkdir(targetDir, { recursive: true })

			const fileExtension = file.name.split(".").pop()?.toLowerCase()
			const finalName = `profileImage.${fileExtension}`
			const filePath = join(targetDir, finalName)

			try {
				await fs.writeFile(filePath, buffer)
			} catch (error) {
				console.error("Error writing file:", error)
				return NextResponse.json(
					{ success: false, message: "File write error" },
					{ status: 500 },
				)
			}

			return NextResponse.json({
				success: true,
				message: `Avatar file ${finalName} uploaded successfully`,
				file: { filename: finalName },
			})
		}

		return NextResponse.json(
			{ success: false, message: "Invalid fileType" },
			{ status: 400 },
		)
	} catch (error) {
		console.error("Server Error:", error)
		return NextResponse.json(
			{ success: false, message: "Internal server error" },
			{ status: 500 },
		)
	}
}
