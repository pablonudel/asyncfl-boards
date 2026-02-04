"use server"

import { prisma } from "@/lib/prisma"
import { GetSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { unlink } from "node:fs/promises"
import { join } from "path"

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

		if (
			!/^[a-zA-Z0-9._-]+$/.test(file.name) ||
			file.name.includes("..") ||
			file.name.startsWith(".") ||
			file.name.endsWith(".")
		)
			return { success: false, message: "Invalid file name." }

		const uploadFile = await fetch(`${process.env.MOTIA_API_URL}/api/upload`, {
			method: "POST",
			body: (() => {
				const formData = new FormData()
				formData.append("userId", session.user.id)
				formData.append("fileType", "avatarFile")
				formData.append("file", file)
				return formData
			})(),
		})
		const uploadResult = await uploadFile.json()

		if (!uploadResult.success) {
			return { success: false, message: uploadResult.message }
		}

		await prisma.user.update({
			where: { id: session.user.id },
			data: {
				image: uploadResult.file.filename,
			},
		})

		revalidatePath("/profile")
		return { success: true, message: "File uploaded" }
	} catch (error) {
		console.error("Error uploading avatar file:", error)
		return { success: false, message: "Failed to upload file" }
	}
}

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

		revalidatePath("/profile")
		return { success: true, message: "File deleted successfully" }
	} catch (error) {
		console.error("Error deleting user avatar file:", error)
		return { success: false, message: "Failed to delete file from storage" }
	}
}
