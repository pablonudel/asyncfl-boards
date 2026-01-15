import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import ScatterDialog from "@/components/widgets/dialogs/scatterDialog"
import type { File } from "@/generated/prisma/client"
import { JsonValue } from "@prisma/client/runtime/client"

export default function AddEditDialog({
	isDialogOpen,
	setIsDialogOpen,
	dialogType,
	projectFiles,
	projectId,
	widgetConfig,
	widgetId,
	mode,
}: {
	isDialogOpen: boolean
	setIsDialogOpen: (open: boolean) => void
	dialogType: { title: string; type: string } | null
	projectFiles: File[]
	projectId: string
	widgetConfig?: JsonValue
	widgetId?: string
	mode: string
}) {
	const scatterTypes = ["rounds", "time"]
	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogContent className='md:min-w-2xl lg:min-w-3xl max-h-[85vh] flex flex-col'>
				{/* Header fijo */}
				<DialogHeader className='shrink-0'>
					<DialogTitle>{dialogType?.title}</DialogTitle>
					<DialogDescription></DialogDescription>
				</DialogHeader>

				{/* Contenido scrolleable */}
				<div className='overflow-y-auto flex-1 px-1'>
					{dialogType?.type && scatterTypes.includes(dialogType.type) && (
						<ScatterDialog
							projectFiles={projectFiles}
							projectId={projectId}
							widgetConfig={widgetConfig}
							widgetId={widgetId}
							setIsDialogOpen={() => setIsDialogOpen(false)}
							type={dialogType.type}
							mode={mode}
						/>
					)}
					{dialogType?.type === "table" && (
						<div>Table Widget Form Goes Here</div>
					)}
					{dialogType?.type === "text" && <div>Text Widget Form Goes Here</div>}
				</div>

				{/* Footer fijo (opcional) */}
				<DialogFooter className='shrink-0'>
					<Button form='scatter-form' type='submit'>
						{mode === "edit" ? "Save Changes" : "Add Widget"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
