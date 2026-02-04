"use server"

import { prisma } from "@/lib/prisma"
import { S3 } from "@/lib/s3Client"
import { GetSession } from "@/lib/session"
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { revalidatePath } from "next/cache"
// import { removeAllProjectFiles } from "../projects/crudFiles.actions"

export async function GetUserById(userId: string) {
	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
		})
		return user || null
	} catch (error) {
		console.error("Error fetching user names:", error)
		return null
	}
}

export async function uploadAvatarFile(file: File) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		if (!/^[a-zA-Z0-9._-]+$/.test(file.name))
			return { success: false, message: "Invalid file name." }
		if (file.name.includes(".."))
			return { success: false, message: "Invalid file name." }

		if (session.user.image) {
			const deleteResponse = await deleteUserAvatarFile(
				session.user.id,
				session.user.image,
			)
			if (!deleteResponse.success) {
				return {
					success: false,
					message: deleteResponse.message,
				}
			}
		}

		const key = `${session.user.id}/${file.name}`

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
		await UpdateUserAvatar(session.user.id, file.name)
		return { success: true, presignedUrl, key, message: "File uploaded" }
	} catch (error) {
		console.error("Error uploading avatar file:", error)
		return { success: false, message: "Failed to upload file" }
	}
}

export async function UpdateUserAvatar(userId: string, imageKey: string) {
	try {
		await prisma.user.update({
			where: { id: userId },
			data: {
				image: imageKey,
			},
		})

		revalidatePath("/profile")
		return {
			success: true,
		}
	} catch (error) {
		console.error("Error updating user:", error)
		return {
			success: false,
		}
	}
}

export async function deleteUserAvatarFile(userId: string, imageKey: string) {
	try {
		const image = imageKey
		const key = `${userId}/${imageKey}`
		const resUserImage = await prisma.user.update({
			where: { id: userId },
			data: { image: null },
		})
		if (!resUserImage)
			return { success: false, message: "Failed to remove avatar from user" }

		const command = new DeleteObjectCommand({
			Bucket: process.env.S3_BUCKET_NAME,
			Key: key,
		})

		const result = await S3.send(command)
		if (result.$metadata.httpStatusCode !== 204) {
			prisma.user.update({
				where: { id: userId },
				data: { image: image },
			})
			return { success: false, message: "Failed to delete file from storage" }
		}
		revalidatePath("/profile")
		return { success: true, message: "File deleted from storage" }
	} catch (error) {
		console.error("Error deleting user avatar file:", error)
		return { success: false, message: "Failed to delete file from storage" }
	}
}

// export async function DeleteAllUserFiles(userId: string) {
// 	try {
// 		const user = await prisma.user.findUnique({
// 			where: { id: userId },
// 			include: { projects: true },
// 		})
// 		if (!user) return { success: false, message: "User not found" }

// 		if (user.image) {
// 			await deleteUserAvatarFile(userId, user.image)
// 		}
// 		if (user.projects && user.projects.length > 0) {
// 			for (const project of user.projects) {
// 				await removeAllProjectFiles(userId, project.id)
// 			}
// 		}
// 	} catch (error) {
// 		console.error("Error deleting user files:", error)
// 		return { success: false, message: "Failed to delete user files" }
// 	}
// }
