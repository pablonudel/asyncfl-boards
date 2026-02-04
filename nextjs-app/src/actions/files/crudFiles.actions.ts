"use server"

import { prisma } from "@/lib/prisma"
import { GetSession } from "@/lib/session"
import { rm } from "fs/promises"
import { revalidatePath, revalidateTag } from "next/cache"
import { unlink } from "node:fs/promises"
import { join } from "path"

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

export async function updateUserFileReferenceName(
	projectId: string,
	fileId: string,
	referenceName: string,
) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const own = await prisma.project.findFirst({
			where: { id: projectId, userId: session.user.id },
			select: { id: true },
		})
		if (!own) return { success: false, message: "Project not found" }

		const updatedFile = await prisma.file.update({
			where: { id: fileId, userId: session.user.id },
			data: {
				referenceName: referenceName,
			},
		})

		revalidatePath(`/projects/${projectId}/settings`)

		return {
			success: true,
			message: `${updatedFile.referenceName} updated successfully`,
		}
	} catch (error) {
		console.error("Failed updating file", error)
		return { success: false, message: "Failed updating file" }
	}
}

export async function uploadUserFile(file: File) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const fileNameOk = /^[a-zA-Z0-9._-]+$/.test(file.name)
		if (!fileNameOk) return { success: false, message: "Invalid file name." }

		const uploadFiles = await fetch(`${process.env.MOTIA_API_URL}/api/upload`, {
			method: "POST",
			body: (() => {
				const formData = new FormData()
				formData.append("userId", session.user.id)
				formData.append("fileType", "resultsFile")
				formData.append("file", file)
				return formData
			})(),
		})
		const uploadResult = await uploadFiles.json()

		if (!uploadResult.success) {
			return { success: false, message: uploadResult.message }
		}

		const fileExists = await getUserFile(session.user.id, file.name)
		if (fileExists) {
			try {
				await prisma.file.update({
					where: { id: fileExists.id, userId: session.user.id },
					data: {
						fileSize: uploadResult.file.fileSize,
						fileShape: uploadResult.file.fileShape,
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
						fileSize: uploadResult.file.fileSize,
						fileShape: uploadResult.file.fileShape,
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

		revalidateTag(`projects:${session.user.id}`, "max")
		// revalidateTag(`project:${projectId}`, "max")
		// revalidatePath(`/projects/${projectId}/settings`)
		// revalidatePath(`/projects/${projectId}`)
		revalidatePath("/projects")
		return { success: true, message: uploadResult.message }
	} catch (error) {
		console.error("Error uploading project file:", error)
		return { success: false, message: "Failed to upload file" }
	}
}

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

		// revalidateTag(`project:${projectId}`, "max")
		// revalidateTag(`project-widgets:${projectId}`, "max")
		// revalidatePath(`/projects/${projectId}/settings`)
		// revalidatePath(`/projects/${projectId}`)

		return { success: true, message: "File removed successfully" }
	} catch (error) {
		console.error("Error removing project file:", error)
		return { success: false, message: "Failed to remove file from the project" }
	}
}

export async function removeAllUserFiles() {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const folderPath = join(
			`${process.env.STORAGE_PATH_BASE}`,
			session.user.id,
			"files",
		)

		await rm(folderPath, {
			recursive: true,
			force: true, // No lanza error si la carpeta no existe
		})

		return { success: true, message: "All files removed successfully" }
	} catch (error) {
		console.error("Error removing all files:", error)
		return { success: false, message: "Failed to remove all files" }
	}
}
