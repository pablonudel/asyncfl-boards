"use client"

import ProjectForm from "@/components/projects/projectForm"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Project } from "@/generated/prisma/client"

export default function ProjectDialog({
	mode,
	open,
	onOpenChange,
	project,
	userId,
}: {
	mode: "create" | "edit"
	open: boolean
	onOpenChange: (open: boolean) => void
	project?: Project
	userId?: string
}) {
	// const [open, setOpen] = useState(false)

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{/* <DialogTrigger asChild>
				<Button>Create New Project</Button>
			</DialogTrigger> */}
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "Create New Project" : "Edit Project"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create" ? "Fill in" : "Update"} the details below to{" "}
						{mode === "create" ? "create a new project." : "edit the project."}
					</DialogDescription>
				</DialogHeader>
				<ProjectForm
					project={project}
					mode={mode}
					onSuccess={() => onOpenChange(false)}
					userId={userId}
				/>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant='secondary'>Cancel</Button>
					</DialogClose>
					<Button type='submit' form='createProjectForm'>
						{mode === "create" ? "Create Project" : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
