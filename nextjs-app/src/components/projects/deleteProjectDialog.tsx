"use client"
import { deleteProject } from "@/actions/projects/crudProjects.actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "../ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog"

export default function DeleteProjectDialog({
	projectId,
	open,
	onOpenChange,
}: {
	projectId: string
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const router = useRouter()

	const handleDeleteProject = async () => {
		const res = await deleteProject(projectId)
		if (!res.success) {
			toast.error(res.message)
		} else {
			toast.success(res.message)
			router.push("/projects")
		}
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Are you sure you want to delete this project?
					</DialogTitle>
				</DialogHeader>
				<DialogDescription>
					This action cannot be undone. This will permanently delete the project
					and all of its data.
				</DialogDescription>
				<DialogFooter>
					<Button variant='secondary' onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button variant='destructive' onClick={() => handleDeleteProject()}>
						Delete Project
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
