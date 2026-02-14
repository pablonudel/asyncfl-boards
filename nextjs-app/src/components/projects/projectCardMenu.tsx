"use client"
import { toggleProjectPublic } from "@/actions/projects/crudProjects.actions"
import { Project } from "@/generated/prisma/client"
import {
	EllipsisVertical,
	Eye,
	EyeOff,
	Link2,
	SquarePen,
	Trash,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "../ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import DeleteProjectDialog from "./deleteProjectDialog"
import ProjectDialog from "./projectDialog"
import PublicLinkDialog from "./publicLinkDialog"

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
	const [showPublicLinkDialog, setShowPublicLinkDialog] = useState(false)

	const handleTogglePublic = async () => {
		const res = await toggleProjectPublic(project.id)
		if (!res.success) {
			toast.error(res.message)
		} else {
			if (res.isPublic) {
				const publicUrl = `${window.location.origin}/public/${res.idPublic}`
				try {
					await navigator.clipboard.writeText(publicUrl)
				} catch (error) {
					console.error("Failed to copy public link to clipboard:", error)
				}
			}
			toast.success(res.message)
			router.refresh()
		}
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
					<DropdownMenuItem
						variant='default'
						onClick={() => setShowProjectDialog(true)}>
						<SquarePen />
						Edit Project
					</DropdownMenuItem>
					<DropdownMenuItem
						variant='default'
						onClick={() => handleTogglePublic()}>
						{project.isPublic ? <EyeOff /> : <Eye />}
						Make {project.isPublic ? "Private" : "Public"}
					</DropdownMenuItem>
					{project.isPublic && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								variant='default'
								onClick={() => setShowPublicLinkDialog(true)}>
								<Link2 />
								Public Link
							</DropdownMenuItem>
						</>
					)}
					<DropdownMenuSeparator />
					<DropdownMenuItem
						variant='destructive'
						onClick={() => setShowDeleteDialog(true)}>
						<Trash />
						Delete Project
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

			{/* Public Link Dialog */}
			<PublicLinkDialog
				project={project}
				open={showPublicLinkDialog}
				onOpenChange={setShowPublicLinkDialog}
			/>

			{/* Delete Dialog */}
			<DeleteProjectDialog
				projectId={project.id}
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
			/>
		</>
	)
}
