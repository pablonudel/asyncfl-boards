import { prisma } from "@/lib/prisma"
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
		const jobName = formData.get("jobName") as string | null
		const jobFolderId = formData.get("jobFolderId") as string | null
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
			if (!jobName || !jobFolderId) {
				return NextResponse.json(
					{
						success: false,
						message:
							"jobName and jobFolderId are required for source/requirements files",
					},
					{ status: 400 },
				)
			}
			try {
				const folderName = `${jobName.replace(/\s+/g, "_").toLowerCase()}-${jobFolderId}`
				const isSource = fileType === "sourceFile"
				const targetDir = isSource
					? join(STORAGE_PATH_BASE, userId, "jobs", folderName, "source")
					: join(STORAGE_PATH_BASE, userId, "jobs", folderName)

				await fs.mkdir(targetDir, { recursive: true })
				const safeName = basename(file.name)
				await fs.writeFile(join(targetDir, safeName), buffer)

				return NextResponse.json({
					success: true,
					message: `${isSource ? "Source" : "Requirements"} file uploaded successfully`,
					file: { fileName: safeName, fileSize: file.size, fileBuffer: buffer },
				})
			} catch (error) {
				console.error("Error handling source/requirements file:", error)
				return NextResponse.json(
					{ success: false, message: "Error processing file upload" },
					{ status: 500 },
				)
			}
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
