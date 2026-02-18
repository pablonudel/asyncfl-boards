"use server"

import { readNpyFile } from "@/lib/readFiles"
import { existsSync, promises as fs } from "fs"
import { basename, join } from "path"

const STORAGE_PATH_BASE = process.env.STORAGE_PATH_BASE!

export async function uploadJobOrReqFile(
	file: File,
	fileType: string,
	userId: string,
	jobName: string,
	jobFolderId: string,
) {
	if (!file) {
		return { success: false, message: "No file provided" }
	}

	if (!fileType || !userId || !jobName || !jobFolderId) {
		return { success: false, message: "Missing required fields" }
	}

	const bytes = await file.arrayBuffer()
	const buffer = Buffer.from(bytes)
	const safeName = basename(file.name)

	try {
		const folderName = `${jobName.replace(/\s+/g, "_").toLowerCase()}-${jobFolderId}`
		let targetDir: string
		if (fileType === "sourceFile") {
			targetDir = join(STORAGE_PATH_BASE, userId, "jobs", folderName, "source")
		} else {
			targetDir = join(STORAGE_PATH_BASE, userId, "jobs", folderName)
		}

		if (!existsSync(targetDir)) {
			await fs.mkdir(targetDir, { recursive: true })
		}
		await fs.writeFile(join(targetDir, safeName), buffer)
		return {
			success: true,
			message: "File uploaded successfully",
			uploadedFile: {
				fileName: safeName,
				fileSize: file.size,
				fileBuffer: buffer,
			},
		}
	} catch (error) {
		console.error("Error handling source/requirements file:", error)
		return { success: false, message: "Error uploading file" }
	}
}

export async function saveAvatarFile(file: File, userId: string) {
	if (!file || !userId) {
		return { success: false, message: "Missing required fields" }
	}

	const fileName = basename(file.name)
	const bytes = await file.arrayBuffer()
	const buffer = Buffer.from(bytes)
	const fileExtension = fileName.split(".").pop()?.toLowerCase()
	const finalName = `profileImage.${fileExtension}`

	try {
		const targetDir = join(STORAGE_PATH_BASE, userId)
		if (!existsSync(targetDir)) {
			await fs.mkdir(targetDir, { recursive: true })
		}
		await fs.writeFile(join(targetDir, finalName), buffer)
		return {
			success: true,
			message: "Avatar uploaded successfully",
			uploadedFile: {
				fileName: finalName,
			},
		}
	} catch (error) {
		console.error("Error uploading avatar:", error)
		return { success: false, message: "Error uploading avatar" }
	}
}

export async function saveResultsFile(file: File, userId: string) {
	if (!file || !userId) {
		return { success: false, message: "Missing required fields" }
	}

	const fileName = basename(file.name)
	const fileExtension = fileName.split(".").pop()?.toLowerCase()
	const bytes = await file.arrayBuffer()
	const buffer = Buffer.from(bytes)
	let shape = [] as number[]

	try {
		const targetDir = join(STORAGE_PATH_BASE, userId, "files")
		if (!existsSync(targetDir)) {
			await fs.mkdir(targetDir, { recursive: true })
		}
		await fs.writeFile(join(targetDir, fileName), buffer)

		if (fileExtension === "npy") {
			shape = (await readNpyFile(userId, fileName)).shape
		}

		return {
			success: true,
			message: "File uploaded successfully",
			uploadedFile: {
				fileName: fileName,
				fileSize: file.size,
				fileExtension: fileExtension,
				fileShape: shape,
			},
		}
	} catch (error) {
		console.error("Error uploading results file:", error)
		return { success: false, message: "Error uploading results file" }
	}
}
