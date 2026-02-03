"use client"

import { uploadProjectFile } from "@/actions/projects/crudFiles.actions"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { FileRejection, useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { Card, CardContent } from "../ui/card"

export default function FileUploader({ projectId }: { projectId: string }) {
	const router = useRouter()
	const [files, setFiles] = useState<
		Array<{
			file: File
		}>
	>([])

	const onDrop = useCallback((acceptedFiles: File[]) => {
		// Do something with the files
		if (acceptedFiles.length > 0)
			setFiles(acceptedFiles.map((file) => ({ file })))

		toast.promise(
			Promise.all(
				acceptedFiles.map((file) => uploadProjectFile(projectId, file)),
			),
			{
				loading: `Uploading ${acceptedFiles.length} files...`,
				success: "Files uploaded successfully!",
				error: "Error uploading files.",
			},
		)
	}, [])

	const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
		// Do something with the files
		if (fileRejections.length > 0) {
			const tooManyFiles = fileRejections.find(
				(fileRejection) => fileRejection.errors[0].code === "too-many-files",
			)
			const fileTooLarge = fileRejections.find(
				(fileRejection) => fileRejection.errors[0].code === "file-too-large",
			)
			const invalidFileType = fileRejections.find(
				(fileRejection) => fileRejection.errors[0].code === "file-invalid-type",
			)

			if (tooManyFiles) {
				toast.error("You can upload a maximum of 6 files at a time.")
			}
			if (fileTooLarge) {
				toast.error("One or more files exceed the maximum size of 5 MB.")
			}
			if (invalidFileType) {
				toast.error("Invalid file type. Only .npy files are allowed.")
			}
		}
	}, [])

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		onDropRejected,
		maxFiles: 6,
		maxSize: 1024 * 1024 * 5, // 5 MB
		accept: {
			"application/octet-stream": [".npy"],
		},
	})

	return (
		<>
			<Card
				className={cn(
					"rounded-md border-dashed border-2 border-foreground/10 p-4 shadow-none h-28",
					isDragActive && "border-solid bg-foreground/5",
				)}
				{...getRootProps()}>
				<CardContent className='flex items-center justify-center h-full w-full'>
					<input {...getInputProps()} />
					{isDragActive ? (
						<p>Drop the files here ...</p>
					) : (
						<div className='text-center'>
							<p>
								Drop some files here (up to 6),
								<br /> or click to select files
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</>
	)
}
