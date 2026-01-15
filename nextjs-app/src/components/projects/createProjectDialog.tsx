"use client"

import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"
import CreateProjectForm from "./createProjectForm"

export default function CreateProjectDialog() {
	const [open, setOpen] = useState(false)

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>Create New Project</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create New Project</DialogTitle>
					<DialogDescription>
						Fill in the details below to create a new project.
					</DialogDescription>
				</DialogHeader>
				<CreateProjectForm onSuccess={() => setOpen(false)} />
				<DialogFooter>
					<DialogClose asChild>
						<Button variant='secondary'>Cancel</Button>
					</DialogClose>
					<Button type='submit' form='createProjectForm'>
						Create
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
