"use server"
import { prisma } from "@/lib/prisma"
import { cacheTag } from "next/cache"

export async function getUserFiles(userId: string) {
	"use cache: remote"
	cacheTag(`files:${userId}`)
	try {
		const user = await prisma.user.findFirst({
			where: { id: userId },
			select: {
				files: {
					select: {
						id: true,
						fileName: true,
						referenceName: true,
						fileSize: true,
						fileShape: true,
						createdAt: true,
						updatedAt: true,
						userId: true,
					},
				},
			},
		})
		if (!user) {
			return {
				success: false,
				message: "User not found",
			}
		}

		return { success: true, files: user.files }
	} catch (error) {
		console.error("Error fetching user files:", error)
		return { success: false, message: "Error fetching user files" }
	}
}
