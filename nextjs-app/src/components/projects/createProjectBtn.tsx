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
	const [showProjectDialog, setShowProjectDialog] = useState(false)
	return (
		<>
			<Button onClick={() => setShowProjectDialog(true)}>
				Create New Project
			</Button>
			<ProjectDialog
				mode={mode}
				open={showProjectDialog}
				onOpenChange={setShowProjectDialog}
				userId={userId}
			/>
		</>
	)
}
