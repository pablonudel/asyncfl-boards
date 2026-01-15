"use client"
import { deleteProject } from "@/actions/projects/crudProjects.actions"
import { redirect } from "next/navigation"
import { toast } from "sonner"
import { mutate } from "swr"
import { Button } from "../ui/button"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog"

export default function DeleteProjectButton({
	projectId,
}: {
	projectId: string
}) {
	const handleDeleteProject = async () => {
		const res = await deleteProject(projectId)
		if (!res.success) {
			toast.error(res.message)
		} else {
			mutate("/api/projects")
			toast.success(res.message)
			redirect("/projects")
		}
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant='destructive'>Delete Project</Button>
			</DialogTrigger>
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
					<DialogClose asChild>
						<Button variant='secondary'>Cancel</Button>
					</DialogClose>
					<Button variant='destructive' onClick={() => handleDeleteProject()}>
						Delete Project
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
