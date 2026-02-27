import { clsx, type ClassValue } from "clsx"
import { nanoid } from "nanoid"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

/**
 * Applies formatting rules to a name string, such as trimming, removing extra spaces, and capitalizing the first letter of each word.
 * @param str
 * @returns The formatted name string.
 * @throws Will throw an error if the input is not a valid string.
 */
export function applyNameRules(str: string) {
	return str
		.trim()
		.replace(/\s+/g, " ") // Remove extra spaces
		.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, "") // Remove non-alphabetic characters except spaces, apostrophes, and hyphens
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter of each word
		.join(" ")
}

/**
 * Normalizes first and last names by applying formatting rules to each. This includes trimming, removing extra spaces, and capitalizing the first letter of each word.
 * @param firstName
 * @param lastName
 * @returns An object containing the normalized first and last names.
 * @throws Will throw an error if either input is not a valid string.
 */
export function normalizeNames(firstName: string, lastName: string) {
	return {
		firstName: applyNameRules(firstName),
		lastName: applyNameRules(lastName),
	}
}

/**
 * Generates a URL-friendly slug from a given name by converting it to lowercase, replacing non-alphanumeric characters with underscores, and appending a unique identifier.
 * @param name
 * @returns A slug string that can be used in URLs, consisting of a unique identifier followed by a formatted version of the input name.
 * @throws Will throw an error if the input name is not a valid string.
 */
export function slugURL(name: string) {
	const urlname = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/(^-|-$)+/g, "")
	return `${nanoid(6)}-${urlname}`
}

/**
 * Normalizes an array of numbers to a range between 0 and 1 by applying min-max normalization. Each value is transformed based on the minimum and maximum values in the array, resulting in a new array where the smallest value becomes 0 and the largest value becomes 1.
 * @param array
 * @returns A new array of numbers normalized to the range [0, 1].
 * @throws Will throw an error if the input is not a valid array of numbers or if all values are the same (to avoid division by zero).
 */
export function normalizeData(array: number[]) {
	const min = Math.min(...array)
	const max = Math.max(...array)
	return array.map((value) => (value - min) / (max - min))
}

/**
 * Calculates the average, maximum, minimum, or sum of values across multiple simulations for a specific column index in a 3D array. The function iterates through each round and simulation to compute the desired aggregation based on the provided method.
 * @param data
 * @param columnIndex
 * @returns An array of aggregated values for each round, based on the specified aggregation method (average, max, min, or sum).
 * @throws Will throw an error if the input data is not a valid 3D array or if an unknown aggregation method is specified.
 */
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

/**
 * Calculates the maximum value across multiple simulations for a specific column index in a 3D array. The function iterates through each round and simulation to find the maximum value based on the provided column index.
 * @param data
 * @param columnIndex
 * @returns An array of maximum values for each round, based on the specified column index across all simulations.
 * @throws Will throw an error if the input data is not a valid 3D array or if the column index is out of bounds.
 */
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

/**
 * Calculates the minimum value across multiple simulations for a specific column index in a 3D array. The function iterates through each round and simulation to find the minimum value based on the provided column index.
 * @param data
 * @param columnIndex
 * @returns An array of minimum values for each round, based on the specified column index across all simulations.
 * @throws Will throw an error if the input data is not a valid 3D array or if the column index is out of bounds.
 */
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

/**
 * Calculates the sum of values across multiple simulations for a specific column index in a 3D array. The function iterates through each round and simulation to compute the total sum based on the provided column index.
 * @param data
 * @param columnIndex
 * @returns An array of summed values for each round, based on the specified column index across all simulations.
 * @throws Will throw an error if the input data is not a valid 3D array or if the column index is out of bounds.
 */
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

/**
 * Calculates the average, maximum, minimum, or sum of values across multiple simulations for a specific column index in a 2D array. The function iterates through each simulation to compute the desired aggregation based on the provided method.
 * @param data
 * @returns An array of aggregated values for each column, based on the specified aggregation method (average, max, min, or sum).
 * @throws Will throw an error if the input data is not a valid 2D array or if an unknown aggregation method is specified.
 */
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

/**
 * Calculates the maximum value across multiple simulations for a specific column index in a 2D array. The function iterates through each simulation to find the maximum value based on the provided column index.
 * @param data
 * @returns An array of maximum values for each column, based on the specified column index across all simulations.
 * @throws Will throw an error if the input data is not a valid 2D array or if the column index is out of bounds.
 */
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

/**
 * Calculates the minimum value across multiple simulations for a specific column index in a 2D array. The function iterates through each simulation to find the minimum value based on the provided column index.
 * @param data
 * @returns An array of minimum values for each column, based on the specified column index across all simulations.
 * @throws Will throw an error if the input data is not a valid 2D array or if the column index is out of bounds.
 */
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

/**
 * Calculates the sum of values across multiple simulations for a specific column index in a 2D array. The function iterates through each simulation to compute the total sum based on the provided column index.
 * @param data
 * @returns An array of summed values for each column, based on the specified column index across all simulations.
 * @throws Will throw an error if the input data is not a valid 2D array or if the column index is out of bounds.
 */
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

/**
 * Reduces an array of numbers to a specified length by uniformly sampling values from the original array. The function calculates a factor based on the ratio of the original array length to the desired length and selects values at regular intervals to create a new array of the specified length.
 * @param array
 * @param length
 * @returns A new array of numbers with the specified length, containing uniformly sampled values from the original array.
 * @throws Will throw an error if the input array is not a valid array of numbers or if the desired length is not a positive integer.
 */
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

/**
 * Shapes data from a 2D or 3D array based on the specified aggregation method (average, max, min, or sum) and normalization option. The function determines the appropriate aggregation method to apply based on the dimensions of the input data and processes it accordingly, returning a new array of values that have been aggregated and optionally normalized.
 * @param shape
 * @param agregation
 * @param data
 * @param columnIndex
 * @param normalize
 * @param numRounds
 * @returns An array of numbers that have been aggregated and optionally normalized based on the specified parameters.
 * @throws Will throw an error if the input data is not a valid 2D or 3D array, if an unknown aggregation method is specified, or if the column index is out of bounds.
 */
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
