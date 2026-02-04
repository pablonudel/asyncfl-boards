"use client"

import { deleteAvatarFile, uploadAvatarFile } from "@/actions/user/user.action"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { Trash, Upload } from "lucide-react"
import Image from "next/image"
import { useCallback } from "react"
import { FileRejection, useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { Button } from "../ui/button"

export default function AvatarUploader() {
	const { data: session, refetch } = authClient.useSession()

	async function uploadFile(file: File) {
		await uploadAvatarFile(file)
		refetch()
	}

	async function deleteFile() {
		await deleteAvatarFile()
		refetch()
	}

	const onDrop = useCallback((acceptedFiles: File[]) => {
		toast.promise(Promise.all(acceptedFiles.map((file) => uploadFile(file))), {
			loading: "Uploading file...",
			success: "File uploaded successfully!",
			error: "Error uploading file.",
		})
		acceptedFiles.forEach(uploadFile)
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
		maxFiles: 1,
		maxSize: 1024 * 1024 * 5, // 5 MB
		accept: {
			"image/*": [".png", ".jpg", ".jpeg"],
		},
	})

	return (
		<div
			className={cn(
				"rounded-full border-dashed border-2 border-foreground/10 p-1 shadow-none h-28 w-28",
				isDragActive && "border-solid bg-foreground/5",
			)}
			{...getRootProps()}>
			<input {...getInputProps()} />
			{session?.user?.image ? (
				<div className='relative'>
					<Image
						src={`${process.env.NEXT_PUBLIC_S3_BUCKET_URL}/${session.user.id}/${session.user.image}`}
						alt='User Avatar'
						width={112}
						height={112}
						className={cn(
							"rounded-full h-full w-full object-cover",
							isDragActive && "opacity-50",
						)}
					/>
					<Button
						variant='default'
						size='icon'
						className='absolute bottom-0 right-0 rounded-full h-7 w-7 bg-red-700 hover:bg-red-500 text-white border-background border-2'
						onClick={(e) => {
							e.stopPropagation()
							toast.promise(deleteFile(), {
								loading: "Deleting avatar...",
								success: "Avatar deleted successfully!",
								error: "Error deleting avatar.",
							})
						}}>
						<Trash />
					</Button>
				</div>
			) : (
				<p className='flex h-full w-full items-center justify-center text-center'>
					<Upload />
				</p>
			)}
			{/* {isDragActive ? (
				<p className='flex h-full w-full items-center justify-center text-center'>
					<CircleUser />
				</p>
			) : (
				<p className='flex h-full w-full items-center justify-center text-center'>
					<Upload />
				</p>
			)} */}
		</div>
	)
}
