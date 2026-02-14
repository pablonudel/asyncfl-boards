"use client"

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Project } from "@/generated/prisma/client"
import Link from "next/link"
// import { nanoid } from "nanoid"

export default function PublicLinkDialog({
	project,
	open,
	onOpenChange,
}: {
	project: Project
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const publicUrl = `${window.location.origin}/public/${project.idPublic}`

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Public Link</DialogTitle>
				</DialogHeader>
				<div className='w-full text-center border-2 rounded-md p-2'>
					<Link
						href={publicUrl}
						target='_blank'
						rel='noopener noreferrer'
						className='hover:underline text-blue-600 font-bold'>
						{publicUrl}
					</Link>
				</div>
			</DialogContent>
		</Dialog>
	)
}
