import { readFileSync } from "node:fs"
import { join } from "node:path"
import { load } from "npyjs"
import { reshape } from "npyjs/reshape"

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
