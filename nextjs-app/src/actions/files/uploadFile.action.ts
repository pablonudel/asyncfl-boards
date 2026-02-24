"use server"

import { readNpyFile } from "@/lib/readFiles"
import { existsSync, promises as fs } from "fs"
import { basename, join } from "path"

const STORAGE_PATH_BASE = process.env.STORAGE_PATH_BASE!

/**
 * Handles the upload of a file associated with a job or requirement. The file is saved to a specific directory structure based on the job name and folder ID. The function also checks for the presence of required fields and returns appropriate success or error messages.
 * @param file
 * @param fileType
 * @param userId
 * @param jobName
 * @param jobFolderId
 * @returns An object indicating success or failure, along with a message and details about the uploaded file if successful.
 */
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

/**
 * Saves a user's file to storage and creates a corresponding record in the database. The function first checks for the presence of required fields, then saves the file to a user-specific directory. If the file is saved successfully, it creates a new record in the database with details about the file. Finally, it triggers cache invalidation for the relevant tags to ensure that the UI reflects the new file immediately.
 * @param file
 * @param userId
 * @returns An object indicating success or failure, along with a message and details about the uploaded file if successful.
 */
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

/**
 * Saves a user's file to storage and creates a corresponding record in the database. The function first checks for the presence of required fields, then saves the file to a user-specific directory. If the file is saved successfully, it creates a new record in the database with details about the file. Finally, it triggers cache invalidation for the relevant tags to ensure that the UI reflects the new file immediately.
 * @param file
 * @param userId
 * @returns An object indicating success or failure, along with a message and details about the uploaded file if successful.
 */
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
