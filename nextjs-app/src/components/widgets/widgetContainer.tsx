"use client"

import type { File, Widget } from "@/generated/prisma/client"
import { cn } from "@/lib/utils"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { memo } from "react"
import { Card, CardContent } from "../ui/card"
import WidgetCardMenu from "../widgets/widgetCardMenu"
import NotesWidget from "./notesWidget"
import ParetoFrontier from "./paretoFrontier"
import ScatterWidget from "./scatterWidget"

function WidgetContainer({
	projectId,
	userFiles = [],
	widget,
	isPublic = false,
}: {
	projectId: string
	userFiles?: File[]
	widget: Widget
	isPublic?: boolean
}) {
	const isFullColumn = Boolean(
		(widget.config as Record<string, any>)?.fullColumn ?? false,
	)

	const {
		setNodeRef,
		transform,
		transition,
		attributes,
		listeners,
		isDragging,
	} = useSortable({ id: widget.id })

	// No need to conditionally set attributes - useSortable always returns safe values
	const dragAttributes = attributes
	const dragListeners = listeners

	const style = {
		transform: CSS.Transform.toString({
			x: transform ? transform.x : 0,
			y: transform ? transform.y : 0,
			scaleX: 1,
			scaleY: 1,
		}),
		transition,
	}

	return (
		<Card
			key={widget.id}
			style={style}
			ref={setNodeRef}
			className={cn(
				`relative group h-fit p-0 col-span-2 ${
					!isFullColumn ? "lg:col-span-1" : ""
				} ${isFullColumn ? "col-span-2" : ""} ${
					isDragging ? "opacity-50" : "opacity-100"
				} ${widget.type === "notes" ? "border-background shadow-none hover:border-foreground/10 bg-transparent" : ""}`,
			)}>
			{!isPublic && (
				<WidgetCardMenu
					projectId={projectId}
					userFiles={userFiles}
					widget={widget}
					dragAttributes={dragAttributes}
					dragListeners={dragListeners}
				/>
			)}

			<CardContent className='px-0'>
				{widget.type === "scatter.rounds" && <ScatterWidget widget={widget} />}
				{widget.type === "scatter.pareto" && <ParetoFrontier widget={widget} />}
				{widget.type === "notes" && (
					<NotesWidget widgetConfig={widget.config} />
				)}
				{/* Other widget types to be implemented... */}
			</CardContent>
		</Card>
	)
}

// Memoize to prevent drag animations from forcing content re-renders
export default memo(WidgetContainer, (prevProps, nextProps) => {
	if (prevProps.widget.id !== nextProps.widget.id) return false
	const prevConfig = JSON.stringify(prevProps.widget.config)
	const nextConfig = JSON.stringify(nextProps.widget.config)
	return prevConfig === nextConfig
})
