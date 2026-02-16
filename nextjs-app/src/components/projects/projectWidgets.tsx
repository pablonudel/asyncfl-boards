"use client"

import { updateProjectWidgetsOrder } from "@/actions/projects/crudProjects.actions"
import type { File, Widget } from "@/generated/prisma/client"
import { cn } from "@/lib/utils"
import {
	closestCenter,
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core"
import {
	arrayMove,
	rectSwappingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { LayoutDashboard } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty"
import WidgetContainer from "../widgets/widgetContainer"

export default function ProjectWidgets({
	projectWidgets,
	widgetsOrder,
	projectId,
	userFiles = [],
	isPublic = false,
	userId,
}: {
	projectWidgets: Widget[]
	widgetsOrder: string[]
	projectId: string
	userFiles?: File[]
	isPublic?: boolean
	userId?: string
}) {
	// Solo manejo de orden (optimistic update)
	const [order, setOrder] = useState<string[]>([])
	const [activeId, setActiveId] = useState<string | number | null>(null)

	// Sincronizar la orden inicial
	useEffect(() => {
		if (widgetsOrder.length > 0) {
			setOrder(widgetsOrder)
		} else if (projectWidgets.length > 0) {
			setOrder(projectWidgets.map((w) => w.id))
		}
	}, [widgetsOrder, projectWidgets])

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	)

	async function handleDragEnd(event: any) {
		const { active, over } = event
		setActiveId(null)

		if (!over || active.id === over.id) return

		const oldIndex = order.indexOf(active.id)
		const newIndex = order.indexOf(over.id)
		if (oldIndex === -1 || newIndex === -1) return

		const oldOrder = [...order]
		const newOrder = arrayMove(order, oldIndex, newIndex)

		// Optimistic update
		setOrder(newOrder)

		// Persistir en servidor
		const res = await updateProjectWidgetsOrder(projectId, newOrder)
		if (!res.success) {
			setOrder(oldOrder)
			toast.error(res.message || "Failed to update order")
		}
	}

	const sortedWidgets = order
		.map((id) => projectWidgets.find((w) => w.id === id))
		.filter((w): w is Widget => !!w)

	if (!projectWidgets || projectWidgets.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia>
						<LayoutDashboard size={48} />
					</EmptyMedia>
					<EmptyTitle>This project has no widgets yet.</EmptyTitle>
				</EmptyHeader>
			</Empty>
		)
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
			onDragStart={(e) => setActiveId(e.active.id)}>
			<SortableContext items={order} strategy={rectSwappingStrategy}>
				<div className='grid grid-cols-2 gap-x-6 gap-y-8'>
					{sortedWidgets.map((widget) => (
						<WidgetContainer
							projectId={projectId}
							userFiles={userFiles}
							key={widget.id}
							widget={widget}
							isPublic={isPublic}
							userId={userId}
						/>
					))}
				</div>
			</SortableContext>
			<DragOverlay>
				{activeId ? (
					<div
						className={cn(
							"shadow-xl rounded-lg",
							sortedWidgets.find((w) => w.id === activeId)?.type === "notes" &&
								"rounded-none bg-background px-8",
						)}>
						<WidgetContainer
							widget={sortedWidgets.find((w) => w.id === activeId) as Widget}
							projectId={projectId}
							userFiles={userFiles}
							isPublic={isPublic}
							userId={userId}
						/>
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	)
}
