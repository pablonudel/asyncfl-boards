"use client"

import type { File, Widget } from "@/generated/prisma/client"
import { cn } from "@/lib/utils"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useEffect, useState } from "react"
import { Card, CardContent } from "../ui/card"
import WidgetCardMenu from "../widgets/widgetCardMenu"
import ParetoFrontier from "./paretoFrontier"
import ScatterWidget from "./scatterWidget"

export default function WidgetContainer({
	projectId,
	userFiles,
	widget,
	isFullColumn,
}: {
	projectId: string
	userFiles: File[]
	widget: Widget
	isFullColumn: boolean
}) {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	const {
		setNodeRef,
		transform,
		transition,
		attributes,
		listeners,
		isDragging,
	} = useSortable({ id: widget.id })

	const dragAttributes = mounted ? attributes : undefined
	const dragListeners = mounted ? listeners : undefined

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
				}`,
			)}>
			<WidgetCardMenu
				projectId={projectId}
				userFiles={userFiles}
				widget={widget}
				isFullColumn={isFullColumn}
				dragAttributes={dragAttributes}
				dragListeners={dragListeners}
			/>
			<div className='py-8 px-2'>
				<CardContent>
					{widget.type === "scatter.rounds" && (
						<ScatterWidget widget={widget} isFullColumn={isFullColumn} />
					)}
					{widget.type === "scatter.pareto" && (
						<ParetoFrontier widget={widget} isFullColumn={isFullColumn} />
					)}
					{/* Other widget types to be implemented... */}
				</CardContent>
			</div>
		</Card>
	)
}
