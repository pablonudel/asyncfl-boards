"use client"

import { regenerateProjectPublicLink } from "@/actions/projects/crudProjects.actions"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Project } from "@/generated/prisma/client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "../ui/button"
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card"

export default function PublicLinkDialog({
	project,
	open,
	onOpenChange,
}: {
	project: Project
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const [publicUrl, setPublicUrl] = useState("")

	useEffect(() => {
		setPublicUrl(`${window.location.origin}/public/${project.idPublic}`)
	}, [project.idPublic])

	const handleRegenerateLink = async () => {
		const result = await regenerateProjectPublicLink(project.id)
		if (result.success) {
			setPublicUrl(`${window.location.origin}/public/${result.idPublic}`)
			toast.success(result.message)
		} else {
			toast.error(result.message)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Public Link</DialogTitle>
				</DialogHeader>
				<div className='flex flex-col md:flex-row items-center gap-2'>
					<div className='w-full text-center border rounded-md py-2 px-1 border-blue-500 text-blue-500 bg-blue-500/10'>
						<Link
							href={publicUrl}
							target='_blank'
							rel='noopener noreferrer'
							className='text-sm font-bold hover:underline'>
							{publicUrl}
						</Link>
					</div>
					<Button
						variant='outline'
						className='w-full md:h-full md:w-auto'
						onClick={() => {
							navigator.clipboard.writeText(publicUrl)
							toast.success("Public link copied to clipboard!")
						}}>
						Copy
					</Button>
				</div>
				<Card>
					<CardHeader>
						<CardTitle>Regenerate Public Link</CardTitle>
					</CardHeader>
					<CardContent className='text-xs'>
						By clicking the button below, you will generate a new public link
						for this project. The previous public link will become invalid and
						will no longer grant access to the project. This action cannot be
						undone.
					</CardContent>
					<CardFooter>
						<Button
							variant='secondary'
							onClick={handleRegenerateLink}
							className='w-full'>
							Regenerate
						</Button>
					</CardFooter>
				</Card>
			</DialogContent>
		</Dialog>
	)
}
