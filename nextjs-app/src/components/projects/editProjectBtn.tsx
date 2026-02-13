"use client"

import ProjectDialog from "@/components/projects/projectDialog"
import { Button } from "@/components/ui/button"
import { SquarePen } from "lucide-react"
import { useState } from "react"

type project = {
	id: string
	name: string
	createdAt: Date
	updatedAt: Date
	description: string | null
}

export default function EditProjectBtn({
	project,
	userId,
}: {
	project: project
	userId?: string
}) {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<>
			<Button
				variant='ghost'
				onClick={() => setIsOpen(true)}
				className='rounded-sm w-full justify-start p-2!'>
				<SquarePen />
				Edit
			</Button>
			<ProjectDialog
				mode='edit'
				open={isOpen}
				onOpenChange={setIsOpen}
				project={project}
				userId={userId}
			/>
		</>
	)
}
