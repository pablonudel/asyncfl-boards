"use client"
import { deleteProject } from "@/actions/projects/crudProjects.actions"
import type { Project } from "@/generated/prisma/client"
import { editProjectSchema } from "@/lib/schemas/projectSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { EllipsisVertical, SquarePen, Trash } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "../ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu"

export default function ProjectCardMenu({
	project,
	userId,
}: {
	project: Project
	userId: string
}) {
	const router = useRouter()
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)

	const form = useForm<z.infer<typeof editProjectSchema>>({
		resolver: zodResolver(editProjectSchema),
		defaultValues: {
			name: project.name,
			description: project.description ?? "",
		},
	})

	const handleDeleteProject = async () => {
		const res = await deleteProject(project.id)
		if (!res.success) {
			toast.error(res.message)
		} else {
			toast.success(res.message)
			router.refresh()
		}
		setShowDeleteDialog(false)
	}

	return (
		<>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<Button variant='ghost' size='icon'>
						<EllipsisVertical />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end'>
					<Link href={`/projects/${project.id}/settings`}>
						<DropdownMenuItem>
							<SquarePen />
							Project Settings
						</DropdownMenuItem>
					</Link>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						variant='destructive'
						onSelect={() => setShowDeleteDialog(true)}>
						<Trash />
						Delete Project
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			{/* Delete Dialog */}
			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Are you sure you want to delete this project?
						</DialogTitle>
					</DialogHeader>
					<DialogDescription>
						This action cannot be undone. This will permanently delete the
						project and all of its data.
					</DialogDescription>
					<DialogFooter>
						<Button
							variant='secondary'
							onClick={() => setShowDeleteDialog(false)}>
							Cancel
						</Button>
						<Button variant='destructive' onClick={() => handleDeleteProject()}>
							Delete Project
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
