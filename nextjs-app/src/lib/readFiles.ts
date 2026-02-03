"use server"

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { load } from "npyjs"
import { reshape } from "npyjs/reshape"

// Function to read a .npy file from S3 and return its data and shape
// export async function readNpyFile(
// 	userId: string,
// 	projectId: string,
// 	fileName: string,
// ) {
// 	const { data, shape, fortranOrder } = await load(
// 		`${process.env.NEXT_PUBLIC_S3_BUCKET_URL}/${userId}/${projectId}/${fileName}`,
// 	)
// 	if (!data || !shape) {
// 		// return { shape: [] }
// 		throw new Error("Failed to load .npy file or file is empty")
// 	}
// 	const array = reshape(
// 		data as unknown as ArrayLike<unknown>,
// 		shape,
// 		fortranOrder,
// 	)
// 	return { array, shape }
// }

export async function readNpyFile(
	userId: string,
	projectId: string,
	fileName: string,
) {
	const absolutePath = join(
		process.env.STORAGE_PATH_BASE!,
		userId,
		"projects",
		projectId,
		"project-files",
		fileName,
	)

	try {
		// Read file synchronously and convert to ArrayBuffer
		const buffer = readFileSync(absolutePath)
		const arrayBuffer = buffer.buffer.slice(
			buffer.byteOffset,
			buffer.byteOffset + buffer.byteLength,
		)

		// Use load() with ArrayBuffer directly
		const { data, shape, fortranOrder } = await load(arrayBuffer)

		if (!data || !shape) {
			throw new Error("El archivo .npy no pudo ser procesado.")
		}

		const array = reshape(
			data as unknown as ArrayLike<unknown>,
			shape,
			fortranOrder,
		)

		return { array, shape }
	} catch (error) {
		console.error("Error crítico en readNpyFile:", error)
		throw error
	}
}
