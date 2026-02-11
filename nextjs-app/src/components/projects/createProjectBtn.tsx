"use client"

import ProjectDialog from "@/components/projects/projectDialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function CreateProjectBtn({
	mode,
	userId,
}: {
	mode: "create" | "edit"
	userId: string
}) {
	const [isOpen, setIsOpen] = useState(false)
	return (
		<>
			<Button onClick={() => setIsOpen(true)}>Create New Project</Button>
			<ProjectDialog
				mode={mode}
				open={isOpen}
				onOpenChange={setIsOpen}
				userId={userId}
			/>
		</>
	)
}
