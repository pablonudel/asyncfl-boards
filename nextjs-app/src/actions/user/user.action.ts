"use server"

import { prisma } from "@/lib/prisma"
import { GetSession } from "@/lib/session"
import { revalidatePath, revalidateTag } from "next/cache"
import { unlink } from "node:fs/promises"
import { join } from "path"
import { saveAvatarFile } from "../files/uploadFile.action"

/**
 * Fetches a user by their ID.
 * @param userId
 * @returns The user object if found, otherwise null.
 */
export async function GetUserById(userId: string) {
	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
		})
		return user || null
	} catch (error) {
		console.error("Error fetching user by ID:", error)
		return null
	}
}

/**
 * Uploads an avatar file for the currently authenticated user.
 * @param file
 * @returns An object containing the success status and a message.
 */
export async function uploadAvatarFile(file: File) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		if (
			!/^[a-zA-Z0-9._-]+$/.test(file.name) ||
			file.name.includes("..") ||
			file.name.startsWith(".") ||
			file.name.endsWith(".")
		)
			return { success: false, message: "Invalid file name." }

		const { success, message, uploadedFile } = await saveAvatarFile(
			file,
			session.user.id,
		)
		if (!uploadedFile) return { success: success, message: message }

		await prisma.user.update({
			where: { id: session.user.id },
			data: {
				image: uploadedFile.fileName,
			},
		})

		revalidateTag(`avatar-${session.user.id}`, "profile")
		revalidatePath("/profile")
		return { success: success, message: message }
	} catch (error) {
		console.error("Error uploading avatar file:", error)
		return { success: false, message: "Failed to upload avatar file" }
	}
}

/**
 * Deletes the avatar file of the currently authenticated user.
 * @returns An object containing the success status and a message.
 */
export async function deleteAvatarFile() {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		if (!session.user.image)
			return { success: false, message: "No avatar to delete" }

		const imagePath = join(
			`${process.env.STORAGE_PATH_BASE}`,
			session.user.id,
			session.user.image,
		)

		try {
			await unlink(imagePath)
		} catch (error) {
			console.error("Error deleting file from storage:", error)
			return { success: false, message: "Failed to delete file from storage" }
		}

		await prisma.user.update({
			where: { id: session.user.id },
			data: {
				image: null,
			},
		})

		revalidateTag(`avatar-${session.user.id}`, "profile")
		revalidatePath("/profile")
		return { success: true, message: "File deleted successfully" }
	} catch (error) {
		console.error("Error deleting user avatar file:", error)
		return { success: false, message: "Failed to delete file from storage" }
	}
}
