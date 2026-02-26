import { prisma } from "@/lib/prisma"
import { promises as fs } from "fs"
import { NextRequest, NextResponse } from "next/server"
import { join } from "node:path"
import path from "path"

export async function GET(
	req: NextRequest,
	ctx: RouteContext<"/api/avatar/[userId]">,
) {
	const { userId } = await ctx.params
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
				"Cache-Control": "public, max-age=900, stale-while-revalidate=300",
			},
		})
	} catch (error) {
		console.error("[Avatar Route] Error:", error)
		return new NextResponse("Internal Server Error", { status: 500 })
	}
}
