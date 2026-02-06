import { clsx, type ClassValue } from "clsx"
import { nanoid } from "nanoid"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

// Apply rules to names: trim, remove extra spaces, remove non-alphabetic characters, capitalize first letter of each word
export function applyNameRules(str: string) {
	return str
		.trim()
		.replace(/\s+/g, " ") // Remove extra spaces
		.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, "") // Remove non-alphabetic characters except spaces, apostrophes, and hyphens
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter of each word
		.join(" ")
}

// Normalize first and last names using the applyNameRules function
export function normalizeNames(firstName: string, lastName: string) {
	return {
		firstName: applyNameRules(firstName),
		lastName: applyNameRules(lastName),
	}
}

// Generate a slug URL from a name
export function slugURL(name: string) {
	const urlname = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/(^-|-$)+/g, "")
	return `${nanoid(6)}-${urlname}`
}

export function normalizeData(array: number[]) {
	const min = Math.min(...array)
	const max = Math.max(...array)
	return array.map((value) => (value - min) / (max - min))
}

// ===== 3D Functions (cálculo cruzado por columna) =====
export function calculateAvg3D(
	data: number[][][],
	columnIndex: number,
): number[] {
	const numRounds = data[0].length
	const result: number[] = []

	for (let round = 0; round < numRounds; round++) {
		let sum = 0
		for (let sim = 0; sim < data.length; sim++) {
			sum += data[sim][round][columnIndex]
		}
		result.push(sum / data.length)
	}

	return result
}

export function calculateMax3D(
	data: number[][][],
	columnIndex: number,
): number[] {
	const numRounds = data[0].length
	const result: number[] = []

	for (let round = 0; round < numRounds; round++) {
		const values = data.map((sim) => sim[round][columnIndex])
		result.push(Math.max(...values))
	}

	return result
}

export function calculateMin3D(
	data: number[][][],
	columnIndex: number,
): number[] {
	const numRounds = data[0].length
	const result: number[] = []

	for (let round = 0; round < numRounds; round++) {
		const values = data.map((sim) => sim[round][columnIndex])
		result.push(Math.min(...values))
	}

	return result
}

export function calculateSum3D(
	data: number[][][],
	columnIndex: number,
): number[] {
	const numRounds = data[0].length
	const result: number[] = []

	for (let round = 0; round < numRounds; round++) {
		let sum = 0
		for (let sim = 0; sim < data.length; sim++) {
			sum += data[sim][round][columnIndex]
		}
		result.push(sum)
	}

	return result
}

// ===== 2D Functions (cálculo cruzado por simulación) =====
export function calculateAvg2D(data: number[][]): number[] {
	if (data.length === 0 || data[0].length === 0) return []

	const numColumns = data[0].length
	const result: number[] = []

	for (let col = 0; col < numColumns; col++) {
		let sum = 0
		for (let sim = 0; sim < data.length; sim++) {
			sum += data[sim][col]
		}
		result.push(sum / data.length)
	}

	return result
}

export function calculateMax2D(data: number[][]): number[] {
	if (data.length === 0 || data[0].length === 0) return []

	const numColumns = data[0].length
	const result: number[] = []

	for (let col = 0; col < numColumns; col++) {
		const values = data.map((sim) => sim[col])
		result.push(Math.max(...values))
	}

	return result
}

export function calculateMin2D(data: number[][]): number[] {
	if (data.length === 0 || data[0].length === 0) return []

	const numColumns = data[0].length
	const result: number[] = []

	for (let col = 0; col < numColumns; col++) {
		const values = data.map((sim) => sim[col])
		result.push(Math.min(...values))
	}

	return result
}

export function calculateSum2D(data: number[][]): number[] {
	if (data.length === 0 || data[0].length === 0) return []

	const numColumns = data[0].length
	const result: number[] = []

	for (let col = 0; col < numColumns; col++) {
		let sum = 0
		for (let sim = 0; sim < data.length; sim++) {
			sum += data[sim][col]
		}
		result.push(sum)
	}

	return result
}

export function uniformData(array: number[], length: number): number[] {
	console.log(array)

	const result: number[] = []
	const factor = array.length / length

	for (let i = 0; i < length; i++) {
		const index = Math.floor(i * factor)
		result.push(array[index])
	}
	return result
}

export function shapeData(
	shape: number[],
	agregation: string,
	data: number[][][] | number[][],
	columnIndex: number,
	normalize: boolean,
	numRounds: number,
): number[] {
	if (shape.length > 2) {
		switch (agregation) {
			case "average":
				const avg3D = calculateAvg3D(data as number[][][], columnIndex)
				return normalize ? normalizeData(avg3D) : avg3D
			case "max":
				const max3D = calculateMax3D(data as number[][][], columnIndex)
				return normalize ? normalizeData(max3D) : max3D
			case "min":
				const min3D = calculateMin3D(data as number[][][], columnIndex)
				return normalize ? normalizeData(min3D) : min3D
			case "sum":
				const sum3D = calculateSum3D(data as number[][][], columnIndex)
				return normalize ? normalizeData(sum3D) : sum3D
			default:
				throw new Error(`Unknown aggregation method: ${agregation}`)
		}
	} else {
		switch (agregation) {
			case "average":
				const avg2D = uniformData(calculateAvg2D(data as number[][]), numRounds)
				return normalize ? normalizeData(avg2D) : avg2D
			case "max":
				const max2D = uniformData(calculateMax2D(data as number[][]), numRounds)
				return normalize ? normalizeData(max2D) : max2D
			case "min":
				const min2D = uniformData(calculateMin2D(data as number[][]), numRounds)
				return normalize ? normalizeData(min2D) : min2D
			case "sum":
				const sum2D = uniformData(calculateSum2D(data as number[][]), numRounds)
				return normalize ? normalizeData(sum2D) : sum2D
			default:
				throw new Error(`Unknown aggregation method: ${agregation}`)
		}
	}
}
