"use client"

import { uploadUserFile } from "@/actions/files/crudFiles.actions"
import { Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef } from "react"
import { toast } from "sonner"
import { Button } from "../ui/button"

export default function FileUploaderButton({
	projectId,
}: {
	projectId: string
}) {
	const router = useRouter()
	const inputRef = useRef<HTMLInputElement>(null)

	async function HandleuploadUserFile(file: File) {
		try {
			const res = await uploadUserFile(file)
			if (!res.success) {
				toast.error(res.message)
				return
			}
			router.refresh()
			toast.success(res.message)
		} catch (error) {
			console.error("Error uploading file:", error)
			toast.error(`${file.name} upload failed`)
		}
	}

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const files = Array.from(e.target.files || [])

		// Validaciones
		if (files.length > 6) {
			toast.error("You can upload a maximum of 6 files at a time.")
			return
		}

		const invalidFiles = files.filter((f) => f.size > 1024 * 1024 * 5)
		if (invalidFiles.length > 0) {
			toast.error("One or more files exceed the maximum size of 5 MB.")
			return
		}

		const invalidTypes = files.filter(
			(f) => !f.name.endsWith(".npy") && !f.name.endsWith(".json"),
		)
		if (invalidTypes.length > 0) {
			toast.error("Invalid file type. Only .npy and .json files are allowed.")
			return
		}

		if (files.length > 0) {
			toast.info(`Uploading ${files.length} file(s)...`)
			files.forEach(HandleuploadUserFile)
		}

		// Reset input
		if (inputRef.current) {
			inputRef.current.value = ""
		}
	}

	return (
		<>
			<input
				ref={inputRef}
				type='file'
				multiple
				accept='.npy,.json'
				onChange={handleFileChange}
				className='hidden'
			/>
			<Button
				type='button'
				variant='outline'
				onClick={() => inputRef.current?.click()}>
				<Upload className='mr-2 h-4 w-4' />
				Upload Files
			</Button>
		</>
	)
}
