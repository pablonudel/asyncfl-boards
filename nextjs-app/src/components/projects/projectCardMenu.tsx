"use client"
import { deleteProject } from "@/actions/projects/crudProjects.actions"
import { Project } from "@/generated/prisma/client"
import { editProjectSchema } from "@/lib/schemas/projectSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { EllipsisVertical, Eye, EyeOff, SquarePen, Trash } from "lucide-react"
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
import ProjectDialog from "./projectDialog"

export default function ProjectCardMenu({
	project,
	onOpenChange,
}: {
	project: Project
	onOpenChange?: (open: boolean) => void
}) {
	const router = useRouter()
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const [showProjectDialog, setShowProjectDialog] = useState(false)

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
			router.push("/projects")
		}
		setShowDeleteDialog(false)
	}

	return (
		<>
			<DropdownMenu modal={false} onOpenChange={onOpenChange}>
				<DropdownMenuTrigger asChild>
					<Button variant='secondary' size='icon' className='rounded-full'>
						<EllipsisVertical />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end'>
					{/* <EditProjectBtn project={project} /> */}
					<DropdownMenuItem onClick={() => setShowProjectDialog(true)}>
						<SquarePen />
						Edit Project
					</DropdownMenuItem>
					<DropdownMenuItem variant='default' className='font-medium'>
						{project.isPublic ? (
							<EyeOff className='text-foreground' />
						) : (
							<Eye className='text-foreground' />
						)}
						Make {project.isPublic ? "Private" : "Public"}
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						variant='destructive'
						onClick={() => setShowDeleteDialog(true)}
						className='font-medium'>
						<Trash />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Project Dialog */}
			<ProjectDialog
				mode='edit'
				open={showProjectDialog}
				onOpenChange={setShowProjectDialog}
				project={project}
			/>

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
