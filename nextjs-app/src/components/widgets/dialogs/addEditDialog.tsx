import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import NotesDialog from "@/components/widgets/dialogs/notesDialog"
import ScatterDialog from "@/components/widgets/dialogs/scatterDialog"
import type { File } from "@/generated/prisma/client"
import { JsonValue } from "@prisma/client/runtime/client"
import ParetoDialog from "./paretoDialog"

export default function AddEditDialog({
	isDialogOpen,
	setIsDialogOpen,
	dialogType,
	userFiles,
	projectId,
	widgetConfig,
	widgetId,
	userId,
	mode,
}: {
	isDialogOpen: boolean
	setIsDialogOpen: (open: boolean) => void
	dialogType: { title: string; type: string } | null
	userFiles?: File[]
	projectId: string
	widgetConfig?: JsonValue
	widgetId?: string
	userId: string
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
							userFiles={userFiles}
							projectId={projectId}
							widgetConfig={widgetConfig}
							widgetId={widgetId}
							setIsDialogOpen={() => setIsDialogOpen(false)}
							type={dialogType.type}
							mode={mode}
						/>
					)}
					{dialogType?.type === "notes" && (
						<NotesDialog
							projectId={projectId}
							widgetConfig={widgetConfig}
							widgetId={widgetId}
							setIsDialogOpen={() => setIsDialogOpen(false)}
							mode={mode}
						/>
					)}
					{dialogType?.type === "pareto" && (
						<ParetoDialog
							userFiles={userFiles}
							projectId={projectId}
							userId={userId}
							widgetConfig={widgetConfig}
							widgetId={widgetId}
							setIsDialogOpen={() => setIsDialogOpen(false)}
							mode={mode}
						/>
					)}
				</div>

				{/* Footer fijo (opcional) */}
				<DialogFooter className='shrink-0'>
					<SubmitButton type={dialogType?.type} mode={mode} />
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

function SubmitButton({
	type,
	mode,
}: {
	type: string | undefined
	mode: string
}) {
	const formId = `${type}-form`
	const buttonText = mode === "edit" ? "Save Changes" : "Add Widget"
	return (
		<Button form={formId} type='submit'>
			{buttonText}
		</Button>
	)
}
