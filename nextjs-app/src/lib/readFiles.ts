"use server"

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { load } from "npyjs"
import { reshape } from "npyjs/reshape"

const STORAGE_PATH_BASE = process.env.STORAGE_PATH_BASE

export async function readNpyFile(userId: string, fileName: string) {
	if (!STORAGE_PATH_BASE) throw new Error("STORAGE_PATH_BASE no configurado")
	const absolutePath = join(STORAGE_PATH_BASE, userId, "files", fileName)

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

export async function readJsonFile(userId: string, fileName: string) {
	if (!STORAGE_PATH_BASE) throw new Error("STORAGE_PATH_BASE no configurado")
	const absolutePath = join(STORAGE_PATH_BASE, userId, "files", fileName)

	try {
		const fileContent = readFileSync(absolutePath, "utf-8")
		const jsonData = JSON.parse(fileContent)
		return jsonData
	} catch (error) {
		console.error("Error crítico en readJsonFile:", error)
		throw error
	}
}
