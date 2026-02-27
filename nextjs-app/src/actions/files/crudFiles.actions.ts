"use server"

import { prisma } from "@/lib/prisma"
import { GetSession } from "@/lib/session"
import { rm } from "fs/promises"
import { revalidatePath, revalidateTag } from "next/cache"
import { unlink } from "node:fs/promises"
import { join } from "path"
import { saveResultsFile } from "./uploadFile.action"

/**
 * Gets a user's file by name.
 * @param userId
 * @param file
 * @returns The file record if found, otherwise null.
 */
export async function getUserFile(userId: string, file: string) {
	try {
		const projectFile = await prisma.file.findFirst({
			where: { fileName: file, userId: userId },
		})
		if (!projectFile) return null
		return projectFile
	} catch (error) {
		console.error("Error finding file", error)
		return null
	}
}

/**
 * Updates the reference name of a user's file.
 * @param fileId
 * @param referenceName
 * @returns An object indicating success or failure, and a message describing the result.
 */
export async function updateUserFileReferenceName(
	fileId: string,
	referenceName: string,
) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const updatedFile = await prisma.file.update({
			where: { id: fileId, userId: session.user.id },
			data: {
				referenceName: referenceName,
			},
		})

		revalidatePath(`/files`)

		return {
			success: true,
			message: `${updatedFile.referenceName} updated successfully`,
		}
	} catch (error) {
		console.error("Failed updating file", error)
		return { success: false, message: "Failed updating file" }
	}
}

/**
 * Uploads a file for the user, saving it to storage and updating the database record.
 * @param file - The file to be uploaded.
 * @returns An object indicating success or failure, and a message describing the result.
 */
export async function uploadUserFile(file: File) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const fileNameOk = /^[a-zA-Z0-9._-]+$/.test(file.name)
		if (!fileNameOk) return { success: false, message: "Invalid file name." }

		const { success, message, uploadedFile } = await saveResultsFile(
			file,
			session.user.id,
		)
		if (!uploadedFile) return { success: success, message }

		const fileExists = await getUserFile(session.user.id, file.name)
		if (fileExists) {
			try {
				await prisma.file.update({
					where: { id: fileExists.id, userId: session.user.id },
					data: {
						fileSize: uploadedFile.fileSize,
						fileShape: uploadedFile.fileShape,
					},
				})
			} catch (error) {
				console.error("Error updating existing file record:", error)
				return {
					success: false,
					message: "Failed to update existing file record",
				}
			}
		} else {
			try {
				await prisma.file.create({
					data: {
						fileName: file.name,
						referenceName: file.name,
						fileSize: uploadedFile.fileSize,
						fileShape: uploadedFile.fileShape,
						userId: session.user.id,
					},
				})
			} catch (error) {
				console.error("Error creating new file record:", error)
				return {
					success: false,
					message: "Failed to create new file record",
				}
			}
		}

		revalidateTag(`files:${session.user.id}`, "max")
		revalidatePath("/files")
		return { success: success, message: message }
	} catch (error) {
		console.error("Error uploading project file:", error)
		return { success: false, message: "Failed to upload file" }
	}
}

/**
 * Removes a user's file by deleting it from storage and removing the database record.
 * @param fileId
 * @param fileName
 * @returns An object indicating success or failure, and a message describing the result.
 */
export async function removeUserFile(fileId: string, fileName: string) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const filePath = join(
			`${process.env.STORAGE_PATH_BASE}`,
			session.user.id,
			"files",
			fileName,
		)

		try {
			await unlink(filePath)
		} catch (error) {
			console.error("Error deleting file from storage:", error)
			return { success: false, message: "Failed to delete file from storage" }
		}

		const result = await prisma.file.delete({
			where: { id: fileId, userId: session.user.id },
		})
		if (!result)
			return { success: false, message: "Failed to delete file record" }

		revalidatePath("/files")

		return { success: true, message: "File removed successfully" }
	} catch (error) {
		console.error("Error removing project file:", error)
		return { success: false, message: "Failed to remove file from the project" }
	}
}

/**
 *
 * @returns An object indicating success or failure, and a message describing the result of the operation.
 */
export async function removeAllUserFiles() {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const folderPath = join(`${process.env.STORAGE_PATH_BASE}`, session.user.id)

		await rm(folderPath, {
			recursive: true,
			force: true,
		})

		return { success: true, message: "All files removed successfully" }
	} catch (error) {
		console.error("Error removing all files:", error)
		return { success: false, message: "Failed to remove all files" }
	}
}

/**
 * Removes all files for a specific user as an admin.
 * @param userId
 * @returns An object indicating success or failure, and a message describing the result of the operation.
 */
export async function removeAllUserFilesAsAdmin(userId: string) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const isAdmin = session.user.role === "admin"

		if (!isAdmin) return { success: false, message: "Forbidden" }

		const folderPath = join(`${process.env.STORAGE_PATH_BASE}`, userId)

		await rm(folderPath, {
			recursive: true,
			force: true,
		})

		return { success: true, message: "All files removed successfully" }
	} catch (error) {
		console.error("Error removing all files:", error)
		return { success: false, message: "Failed to remove all files" }
	}
}
