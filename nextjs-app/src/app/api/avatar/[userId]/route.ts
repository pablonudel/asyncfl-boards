import { prisma } from "@/lib/prisma"
import { promises as fs } from "fs"
import { cacheTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { join } from "node:path"
import path from "path"

export const cacheConfig = {
	stale: 300, // 5 minutes
	revalidate: 900, // 15 minutes
}

export async function GET(
	req: NextRequest,
	ctx: RouteContext<"/api/avatar/[userId]">,
) {
	"use cache"
	const { userId } = await ctx.params
	cacheTag(`avatar-${userId}`)
	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { image: true },
		})

		if (!user || !user.image) {
			return new NextResponse("No avatar found", { status: 404 })
		}

		const filePath = join(
			`${process.env.STORAGE_PATH_BASE}`,
			userId,
			user.image,
		)

		const imageBuffer = await fs.readFile(filePath)

		const ext = path.extname(user.image).toLowerCase()

		const mimeTypes: Record<string, string> = {
			".png": "image/png",
			".jpg": "image/jpeg",
			".jpeg": "image/jpeg",
		}

		const contentType = mimeTypes[ext] || "application/octet-stream"

		return new NextResponse(imageBuffer, {
			headers: {
				"Content-Type": contentType,
				"Content-Length": imageBuffer.length.toString(),
			},
		})
	} catch (error) {
		return new NextResponse("Internal Server Error", { status: 500 })
	}
}
