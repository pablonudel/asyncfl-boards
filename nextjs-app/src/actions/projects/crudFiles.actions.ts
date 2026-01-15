"use server"

import type { File as DBFile } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { readNpyFile } from "@/lib/readFiles"
import { S3 } from "@/lib/s3Client"
import { GetSession } from "@/lib/session"
import {
	DeleteObjectCommand,
	DeleteObjectsCommand,
	ListObjectsV2Command,
	PutObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { revalidatePath, revalidateTag } from "next/cache"

export async function getProjectFile(projectId: string, file: string) {
	try {
		const projectFile = await prisma.file.findFirst({
			where: { fileName: file, project: { id: projectId } },
		})
		if (!projectFile) return null
		return projectFile
	} catch (error) {
		console.error("Error finding file", error)
		return null
	}
}

export async function updateProjectFile(projectId: string, file: DBFile) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const own = await prisma.project.findFirst({
			where: { id: projectId, userId: session.user.id },
			select: { id: true },
		})
		if (!own) return { success: false, message: "Project not found" }

		const { shape } = await readNpyFile(
			session.user.id,
			projectId,
			file.fileName
		)

		const updatedFile = await prisma.file.update({
			where: { id: file.id, project: { id: projectId } },
			data: {
				fileSize: file.fileSize,
				referenceName: file.referenceName,
				fileShape: shape,
			},
		})

		return {
			success: true,
			message: `${updatedFile.referenceName} updated successfully`,
		}
	} catch (error) {
		console.error("Failed updating file", error)
		return { success: false, message: "Failed updating file" }
	}
}

export async function addProjectFile(
	projectId: string,
	fileName: string,
	fileSize: number
) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const project = await prisma.project.findFirst({
			where: { id: projectId, userId: session.user.id },
			select: { files: { select: { fileName: true } } },
		})
		if (!project) return { success: false, message: "Project not found" }

		const exists = project.files.some((f) => f.fileName === fileName)
		if (exists) {
			const projectFile = await getProjectFile(projectId, fileName)
			if (!projectFile) return { success: false, message: "File not found" }
			return updateProjectFile(projectId, projectFile)
		}

		const { shape } = await readNpyFile(session.user.id, projectId, fileName)

		const newFile = await prisma.file.create({
			data: {
				fileName,
				projectId,
				referenceName: fileName,
				fileSize,
				fileShape: shape,
			},
		})

		return { success: true, message: `${newFile.fileName} added successfully` }
	} catch (error) {
		console.error("Error adding project file:", error)
		return {
			success: false,
			message: "Failed to add file to the project. Try again later.",
		}
	}
}

export async function uploadProjectFile(projectId: string, file: File) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const own = await prisma.project.findFirst({
			where: { id: projectId, userId: session.user.id },
			select: { id: true },
		})
		if (!own) return { success: false, message: "Project not found" }
		if (!process.env.S3_BUCKET_NAME)
			return { success: false, message: "S3 bucket not configured" }

		const fileNameOk = /^[a-zA-Z0-9._-]+$/.test(file.name)
		if (!fileNameOk) return { success: false, message: "Invalid file name." }

		const key = `${session.user.id}/${projectId}/${file.name}`
		// Validación básica del key
		if (!key || key.includes(".."))
			return { success: false, message: "Invalid key" }

		const command = new PutObjectCommand({
			Bucket: process.env.S3_BUCKET_NAME,
			Key: key,
			ContentType: file.type,
			ContentLength: file.size,
		})

		const presignedUrl = await getSignedUrl(S3 as any, command as any, {
			expiresIn: 3600, // 1h
		})

		const uploadResponse = await fetch(presignedUrl, {
			method: "PUT",
			headers: {
				"Content-Type": file.type,
			},
			body: file,
		})

		if (!uploadResponse.ok)
			return { success: false, message: "Failed to upload file" }

		const addedFile = await addProjectFile(projectId, file.name, file.size)
		if (!addedFile.success) {
			await removeProjectFileFromStorage(projectId, file.name)
			return { success: false, message: addedFile.message }
		}

		revalidateTag(`projects:${session.user.id}`, "max")
		revalidateTag(`project:${projectId}`, "max")
		revalidateTag(`project-widgets:${projectId}`, "max")
		revalidatePath(`/projects/${projectId}/settings`)
		revalidateTag(`project-files:${projectId}`, "max")
		revalidatePath(`/projects/${projectId}`)
		return { success: true, presignedUrl, key, message: addedFile.message }
	} catch (error) {
		console.error("Error uploading project file:", error)
		return { success: false, message: "Failed to upload file" }
	}
}

async function removeProjectFileFromStorage(
	projectId: string,
	fileName: string
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

		if (!process.env.S3_BUCKET_NAME)
			return { success: false, message: "S3 bucket not configured" }

		const key = `${session.user.id}/${projectId}/${fileName}`

		const command = new DeleteObjectCommand({
			Bucket: process.env.S3_BUCKET_NAME,
			Key: key,
		})

		const result = await S3.send(command)
		if (result.$metadata.httpStatusCode !== 204)
			return { success: false, message: "Failed to delete file from storage" }

		revalidateTag(`project:${projectId}`, "max")
		revalidateTag(`project-widgets:${projectId}`, "max")
		revalidatePath(`/projects/${projectId}/settings`)
		revalidatePath(`/projects/${projectId}`)
		return { success: true, message: "File removed from storage successfully" }
	} catch (error) {
		console.error("Error removing project file from storage:", error)
		return { success: false, message: "Failed to remove file from storage" }
	}
}

export async function removeProjectFile(
	projectId: string,
	fileId: string,
	fileName: string
) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const storageRes = await removeProjectFileFromStorage(projectId, fileName)
		if (!storageRes.success)
			return { success: false, message: storageRes.message }

		const result = await prisma.file.delete({
			where: { id: fileId, project: { id: projectId } },
		})
		if (!result)
			return { success: false, message: "Failed to delete file record" }

		revalidateTag(`project:${projectId}`, "max")
		revalidateTag(`project-widgets:${projectId}`, "max")
		revalidatePath(`/projects/${projectId}/settings`)
		revalidatePath(`/projects/${projectId}`)

		return { success: true, message: "File removed successfully" }
	} catch (error) {
		console.error("Error removing project file:", error)
		return { success: false, message: "Failed to remove file from the project" }
	}
}

export async function removeAllProjectFiles(userId: string, projectId: string) {
	try {
		const project = await prisma.project.findFirst({
			where: { id: projectId, userId: userId },
			select: { files: { select: { id: true, fileName: true } } },
		})
		if (!project) return { success: false, message: "Project not found" }

		let count = 0
		async function recursiveDelete(
			userId: string,
			token: string | undefined = undefined
		) {
			//get the files
			const listCommand = new ListObjectsV2Command({
				Bucket: `${process.env.S3_BUCKET_NAME}`,
				Prefix: `${userId}/${projectId}/`,
				ContinuationToken: token,
			})
			let list = await S3.send(listCommand)
			if (list.KeyCount) {
				const deleteCommand = new DeleteObjectsCommand({
					Bucket: `${process.env.S3_BUCKET_NAME}`,
					Delete: {
						Objects: list.Contents?.map((item) => ({ Key: item.Key })),
						Quiet: false,
					},
				})
				let deleted = await S3.send(deleteCommand)
				if (deleted.Errors)
					return { success: false, message: "Error deleting some files" }
				if (deleted.Deleted) count += deleted.Deleted.length
			}
			// repeat if more files to delete
			if (list.NextContinuationToken) {
				recursiveDelete(list.NextContinuationToken)
			}
			// return total deleted count when finished
			return { success: true, message: `Deleted ${count} files.` }
		}
		return recursiveDelete(userId)
	} catch (error) {
		console.error("Error removing all project files:", error)
		return { success: false, message: "Failed to remove project files" }
	}
}
