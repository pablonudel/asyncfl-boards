"use client"

import type { File } from "@/generated/prisma/client"
import { useState } from "react"
import { Button } from "../ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import AddEditDialog from "../widgets/dialogs/addEditDialog"

export default function AddWidgetDropdown({
	projectFiles,
	projectId,
}: {
	projectFiles: File[]
	projectId: string
}) {
	interface WidgetType {
		type: string
		title: string
	}

	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [dialogType, setDialogType] = useState<WidgetType | null>(null)

	function handleAddWidget({ type, title }: WidgetType) {
		setDialogType({ type, title })
		setIsDialogOpen(true)
	}

	const scatterTypes = ["rounds", "time"]
	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant='default'>Add Widget</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end'>
					<DropdownMenuItem
						onClick={() =>
							handleAddWidget({
								type: "rounds",
								title: "Add Acc/Loss vs Rounds",
							})
						}>
						Acc/Loss vs Rounds
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() =>
							handleAddWidget({ type: "time", title: "Add Acc/Loss vs Time" })
						}>
						Acc/Loss vs Time
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() =>
							handleAddWidget({ type: "table", title: "Add Table" })
						}>
						Table Widget
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() =>
							handleAddWidget({ type: "text", title: "Add Text" })
						}>
						Text Widget
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AddEditDialog
				isDialogOpen={isDialogOpen}
				setIsDialogOpen={setIsDialogOpen}
				dialogType={dialogType}
				projectFiles={projectFiles}
				projectId={projectId}
				mode='create'
			/>
		</>
	)
}
