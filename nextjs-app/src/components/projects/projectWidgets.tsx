"use client"

import { updateProjectWidgetsOrder } from "@/actions/projects/crudProjects.actions"
import type { File, Widget } from "@/generated/prisma/client"
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
	userFiles,
}: {
	projectWidgets: Widget[]
	widgetsOrder: string[]
	projectId: string
	userFiles: File[]
}) {
	// Fetch de los widgets del proyecto via SWR

	// Estado local para orden (optimistic update)
	const [widgetOrder, setWidgetOrder] = useState<string[]>([])

	// Estado local para las configs de cada widget
	const [widgetConfigs, setWidgetConfigs] = useState<Record<string, any>>({})

	const [activeId, setActiveId] = useState(null)

	// Sincronizar con datos del servidor cuando llegan
	useEffect(() => {
		if (projectWidgets.length === 0) return

		// Inicializar orden desde el servidor
		const newOrder = widgetsOrder.length
			? widgetsOrder
			: projectWidgets.map((w) => w.id)
		setWidgetOrder(newOrder)

		// Inicializar/sincronizar configs
		setWidgetConfigs((prev) => {
			const next = { ...prev }
			for (const w of projectWidgets) {
				next[w.id] = w.config ?? { fullColumn: false }
			}
			// Remover configs de widgets eliminados
			for (const k of Object.keys(next)) {
				if (!projectWidgets.find((w) => w.id === k)) {
					delete next[k]
				}
			}
			return next
		})
	}, [projectWidgets, widgetsOrder])

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	)

	async function persistOrder(oldOrder: string[], newOrder: string[]) {
		try {
			const resOrder = await updateProjectWidgetsOrder(projectId, newOrder)
			if (!resOrder.success) {
				setWidgetOrder(oldOrder)
				toast.error(resOrder.message)
			}
		} catch (error) {
			setWidgetOrder(oldOrder)
			toast.error("Failed to update widget order")
		}
	}

	function handleDragStart(event: any) {
		setActiveId(event.active.id)
	}

	function handleDragEnd(event: any) {
		setActiveId(null)
		const { active, over } = event

		if (!over || active.id === over.id) return

		const oldIndex = widgetOrder.indexOf(active.id)
		const newIndex = widgetOrder.indexOf(over.id)
		if (oldIndex === -1 || newIndex === -1) return

		const oldOrder = [...widgetOrder]
		const newOrder = arrayMove(widgetOrder, oldIndex, newIndex)

		// Optimistic update: solo el orden
		setWidgetOrder(newOrder)

		// Persistir en background
		void persistOrder(oldOrder, newOrder)
	}

	const sortedWidgets = widgetOrder
		.map((id) => projectWidgets.find((w) => w.id === id))
		.filter((w): w is Widget => !!w)

	const sortedWidgetsIds = sortedWidgets.map((w) => w.id)

	// Estado de error
	if (!projectWidgets) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia>
						<LayoutDashboard size={48} />
					</EmptyMedia>
					<EmptyTitle>Failed to load widgets</EmptyTitle>
				</EmptyHeader>
			</Empty>
		)
	}

	// Sin widgets
	if (projectWidgets.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia>
						<LayoutDashboard size={48} />
					</EmptyMedia>
					<EmptyTitle>You haven&apos;t created any widget yet.</EmptyTitle>
				</EmptyHeader>
			</Empty>
		)
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
			onDragStart={handleDragStart}>
			<SortableContext items={sortedWidgetsIds} strategy={rectSwappingStrategy}>
				<div className='grid grid-cols-2  gap-6 pt-6'>
					{sortedWidgets.map((widget) => {
						const isFullColumn = Boolean(widgetConfigs[widget.id]?.fullColumn)
						return (
							<WidgetContainer
								projectId={projectId}
								userFiles={userFiles}
								key={widget.id}
								widget={widget}
								isFullColumn={isFullColumn}
							/>
						)
					})}
				</div>
			</SortableContext>
			<DragOverlay>
				{activeId ? (
					<div className='shadow-2xl rounded-lg'>
						<WidgetContainer
							widget={projectWidgets.find((w) => w.id === activeId) as Widget}
							isFullColumn={Boolean(
								widgetConfigs[activeId]?.fullColumn ?? false,
							)}
							projectId={projectId}
							userFiles={userFiles}
						/>
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	)
}
