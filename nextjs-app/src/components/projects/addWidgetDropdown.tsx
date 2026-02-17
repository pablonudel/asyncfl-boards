"use client"

import type { File } from "@/generated/prisma/client"
import { Plus } from "lucide-react"
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
	userFiles,
	projectId,
}: {
	userFiles: File[]
	projectId: string
}) {
	interface WidgetType {
		type: string
		title: string
	}

	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [dialogType, setDialogType] = useState<WidgetType | null>(null)
	const [isMenuOpen, setIsMenuOpen] = useState(false)

	function handleAddWidget({ type, title }: WidgetType) {
		setDialogType({ type, title })
		setIsDialogOpen(true)
	}

	const scatterTypes = ["rounds", "time"]
	return (
		<>
			<DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
				<DropdownMenuTrigger asChild>
					{/* <Button variant='default'>Add Widget</Button> */}
					<Button
						size='icon'
						variant='default'
						className={`
    fixed bottom-8 right-8 rounded-full z-50 
    transition-all duration-300 overflow-hidden group h-12 bg-foreground hover:bg-foreground font-bold
    ${isMenuOpen ? "w-40" : "w-12 hover:w-40"}
  `}>
						{/* Un solo contenedor flex para todo el contenido */}
						<div className='flex items-center justify-start w-full px-3.5'>
							{/* El icono siempre está ahí */}
							<Plus strokeWidth={4} className='min-w-5' />

							{/* El texto aparece si el menú está abierto O si hay hover */}
							<span
								className={`
        ml-2 whitespace-nowrap transition-all duration-300
        ${isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
      `}>
								Add Widget
							</span>
						</div>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='center' side='top' sideOffset={12}>
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
							handleAddWidget({ type: "notes", title: "Add Note" })
						}>
						Notes
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AddEditDialog
				isDialogOpen={isDialogOpen}
				setIsDialogOpen={setIsDialogOpen}
				dialogType={dialogType}
				userFiles={userFiles}
				projectId={projectId}
				mode='create'
			/>
		</>
	)
}
