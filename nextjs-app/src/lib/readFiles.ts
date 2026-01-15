import { load } from "npyjs"
import { reshape } from "npyjs/reshape"

// Function to read a .npy file from S3 and return its data and shape
export async function readNpyFile(
	userId: string,
	projectId: string,
	fileName: string
) {
	const { data, shape, fortranOrder } = await load(
		`${process.env.NEXT_PUBLIC_S3_BUCKET_URL}/${userId}/${projectId}/${fileName}`
	)
	if (!data || !shape) {
		// return { shape: [] }
		throw new Error("Failed to load .npy file or file is empty")
	}
	const array = reshape(
		data as unknown as ArrayLike<unknown>,
		shape,
		fortranOrder
	)
	return { array, shape }
}
