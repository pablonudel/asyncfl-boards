"use client"

import { switchWidgetColumnType } from "@/actions/widgets/crudWidgets.actions"
import DeleteWidgetButton from "@/components/projects/deleteWidgetButton"
import type { File, Widget } from "@/generated/prisma/client"
import type { DraggableAttributes } from "@dnd-kit/core"
import { ChevronLeft, ChevronRight, Move, Settings } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "../ui/button"
import AddEditDialog from "./dialogs/addEditDialog"

interface WidgetType {
	type: string
	title: string
}

export default function WidgetCardMenu({
	projectId,
	userFiles,
	widget,
	dragAttributes,
	dragListeners,
}: {
	projectId: string
	userFiles?: File[]
	widget: Widget
	dragAttributes?: DraggableAttributes
	dragListeners?: {}
}) {
	const [isPending, startTransition] = useTransition()
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [dialogType, setDialogType] = useState<WidgetType | null>(null)

	const isFullColumn = Boolean(
		(widget.config as Record<string, any>)?.fullColumn ?? false,
	)
	const widgetTitle =
		JSON.parse(JSON.stringify(widget.config)).layoutConfig?.title ?? "Notes"

	function handleColumnSwitch() {
		startTransition(async () => {
			const res = await switchWidgetColumnType(widget.id)
			if (!res.success) {
				toast.error(res.message)
			}
		})
	}

	function handleEditWidget({ type, title }: WidgetType) {
		setDialogType({ type, title })
		setIsDialogOpen(true)
	}

	function getWidgetType() {
		if (widget.type!.startsWith("scatter")) {
			return widget.type!.split(".")[1]
		}
		return widget.type || "text"
	}

	return (
		<>
			<div className='flex justify-center w-full gap-1 absolute top-0 px-4 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity delay-500 duration-300 z-10'>
				<div className='bg-background p-1 rounded-full space-x-1 border'>
					<Button
						variant='secondary'
						size='icon'
						className='rounded-full w-8 h-8'
						onClick={handleColumnSwitch}
						disabled={isPending}>
						{isFullColumn ? <ChevronLeft /> : <ChevronRight />}
					</Button>
					<Button
						variant='secondary'
						size='icon'
						className='rounded-full h-8 w-8'
						{...(dragAttributes ?? {})}
						{...(dragListeners ?? {})}>
						<Move />
					</Button>
					<Button
						variant='secondary'
						size='icon'
						className='rounded-full w-8 h-8'
						onClick={() =>
							handleEditWidget({
								type: getWidgetType(),
								title: `Edit ${widgetTitle}`,
							})
						}>
						<Settings />
					</Button>
					<DeleteWidgetButton widgetId={widget.id} projectId={projectId} />
				</div>
			</div>

			<AddEditDialog
				isDialogOpen={isDialogOpen}
				setIsDialogOpen={setIsDialogOpen}
				dialogType={dialogType}
				userFiles={userFiles}
				projectId={projectId}
				widgetConfig={widget.config}
				widgetId={widget.id}
				mode='edit'
			/>
		</>
	)
}
