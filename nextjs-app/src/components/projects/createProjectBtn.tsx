"use client"

import ProjectDialog from "@/components/projects/projectDialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
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
			<Button
				onClick={() => setShowProjectDialog(true)}
				size='icon'
				variant='default'
				className='fixed bottom-8 right-8 h-12 w-12 rounded-full z-50 bg-foreground hover:bg-foreground hover:w-44 transition-all duration-300 overflow-hidden group font-bold'>
				{/* Contenedor alineado a la izquierda con padding constante */}
				<div className='flex items-center justify-start w-full px-3.5'>
					{/* Icono fijo que sirve como ancla visual */}
					<Plus strokeWidth={4} className='min-w-5' />

					{/* Texto que aparece suavemente al ensancharse el botón */}
					<span className='ml-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
						Create Project
					</span>
				</div>
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
