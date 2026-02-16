import { readNpyFile } from "@/lib/readFiles"
import { promises as fs } from "fs"
import { NextRequest, NextResponse } from "next/server"
import { basename, join } from "path"

const STORAGE_PATH_BASE = process.env.STORAGE_PATH_BASE!

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData()

		// Extraemos los campos y el archivo
		const file = formData.get("file") as File | null
		const userId = formData.get("userId") as string | null
		const fileType = formData.get("fileType") as string | null

		if (!fileType) {
			return NextResponse.json(
				{ success: false, message: "Missing fileType" },
				{ status: 400 },
			)
		}

		if (!file || !userId) {
			return NextResponse.json(
				{ success: false, message: "Missing required fields" },
				{ status: 400 },
			)
		}

		// Convertimos el archivo a Buffer (equivalente a file.buffer de multer)
		const arrayBuffer = await file.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)

		// --- Lógica para "resultsFile" ---
		if (fileType === "resultsFile") {
			const targetDir = join(STORAGE_PATH_BASE, userId, "files")
			await fs.mkdir(targetDir, { recursive: true })

			const safeName = basename(file.name)
			const filePath = join(targetDir, safeName)

			try {
				await fs.writeFile(filePath, buffer)
			} catch (error) {
				console.error("Error writing file:", error)
				return NextResponse.json(
					{ success: false, message: "File write error" },
					{ status: 500 },
				)
			}

			let shape = null
			try {
				shape = (await readNpyFile(userId, safeName)).shape
			} catch (error) {
				console.error("Error reading file shape:", error)
				return NextResponse.json(
					{ success: false, message: "File read error" },
					{ status: 500 },
				)
			}

			return NextResponse.json({
				success: true,
				message: `Results file ${safeName} uploaded successfully`,
				file: {
					fileName: safeName,
					fileSize: file.size,
					fileShape: shape,
				},
			})
		}

		// --- Lógica para "avatarFile" ---
		if (fileType === "avatarFile") {
			const targetDir = join(STORAGE_PATH_BASE, userId)
			await fs.mkdir(targetDir, { recursive: true })

			const fileExtension = file.name.split(".").pop()?.toLowerCase()
			const finalName = `profileImage.${fileExtension}`
			const filePath = join(targetDir, finalName)

			try {
				await fs.writeFile(filePath, buffer)
			} catch (error) {
				console.error("Error writing file:", error)
				return NextResponse.json(
					{ success: false, message: "File write error" },
					{ status: 500 },
				)
			}

			return NextResponse.json({
				success: true,
				message: `Avatar file ${finalName} uploaded successfully`,
				file: { filename: finalName },
			})
		}

		return NextResponse.json(
			{ success: false, message: "Invalid fileType" },
			{ status: 400 },
		)
	} catch (error) {
		console.error("Server Error:", error)
		return NextResponse.json(
			{ success: false, message: "Internal server error" },
			{ status: 500 },
		)
	}
}
