"use client"

import { removeUserFile } from "@/actions/files/crudFiles.actions"
import type { File } from "@/generated/prisma/client"
import { Trash } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "../ui/button"

export default function DeleteFileButton({ file }: { file: File }) {
	const router = useRouter()
	async function handleDelete() {
		toast.promise(removeUserFile(file.id, file.fileName), {
			loading: `Deleting ${file.referenceName}...`,
			success: `${file.referenceName} deleted successfully!`,
			error: `Error deleting ${file.referenceName}.`,
		})
		router.refresh()
	}
	return (
		<Button variant='ghost' size='icon' onClick={handleDelete}>
			<Trash className='text-destructive' />
		</Button>
	)
}
