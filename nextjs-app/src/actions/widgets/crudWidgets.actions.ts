"use server"

import type { Widget } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { GetSession } from "@/lib/session"
import { revalidatePath, revalidateTag } from "next/cache"

export async function createScatterWidget(
	projectId: string,
	dataConfig: any,
	layoutConfig: any,
	widgetSubtype: string,
) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const project = await prisma.project.findFirst({
			where: { id: projectId, userId: session.user.id },
			select: { widgetsOrder: true },
		})
		if (!project) return { success: false, message: "Project not found" }

		const widget = await prisma.widget.create({
			data: {
				config: { fullColumn: true, dataConfig, layoutConfig },
				projectId,
				type: `scatter.${widgetSubtype}`,
			},
		})

		const order = [...project.widgetsOrder, widget.id]
		await prisma.project.update({
			where: { id: projectId },
			data: { widgetsOrder: order },
		})

		revalidateTag(`projects:${session.user.id}`, "max")
		revalidateTag(`project:${projectId}`, "max")
		revalidateTag(`project-widgets:${projectId}`, "max")
		revalidatePath(`/projects/${projectId}`)

		return {
			success: true,
			message: "Widget created successfully",
			widgetId: widget.id,
		}
	} catch (error) {
		console.error("Error creating widget:", error)
		return { success: false, message: "Failed to create widget" }
	}
}

export async function updateScatterConfig(
	widgetId: string,
	dataConfig: any,
	layoutConfig: any,
) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const res = await getWidgetById(widgetId)
		if (!res.success || !res.widget)
			return { success: res.success, message: res.message }

		const own = await prisma.project.findFirst({
			where: { id: res.widget.projectId, userId: session.user.id },
			select: { id: true },
		})
		if (!own) return { success: false, message: "Project not found" }

		const currentConfig = (res.widget?.config as Record<string, any>) || {}
		const fullColumn = currentConfig.fullColumn ?? false

		await prisma.widget.update({
			where: { id: widgetId },
			data: { config: { fullColumn, dataConfig, layoutConfig } },
		})

		revalidateTag(`projects:${session.user.id}`, "max")
		revalidateTag(`project:${res.widget.projectId}`, "max")
		revalidateTag(`project-widgets:${res.widget.projectId}`, "max")
		revalidatePath(`/projects/${res.widget.projectId}`)

		return { success: true, message: "Widget updated successfully" }
	} catch (error) {
		console.error("Error updating widget config:", error)
		return { success: false, message: "Failed to update widget config" }
	}
}

export async function getWidgetsByProjectId(projectId: string) {
	try {
		const project = await prisma.project.findUnique({
			where: { id: projectId },
			select: { widgetsOrder: true },
		})
		if (!project) return { success: false, message: "Project not found" }

		const widgets: Widget[] = []
		for (const widgetId of project.widgetsOrder) {
			const widget = await prisma.widget.findUnique({ where: { id: widgetId } })
			if (widget) widgets.push(widget)
		}
		return { success: true, widgets }
	} catch (error) {
		console.error("Error fetching widgets:", error)
		return { success: false, message: "Failed to fetch widgets" }
	}
}

export async function getWidgetById(widgetId: string) {
	try {
		const widget = await prisma.widget.findUnique({ where: { id: widgetId } })
		return { success: true, widget }
	} catch (error) {
		console.error("Error fetching widget by ID:", error)
		return { success: false, message: "Widget not found" }
	}
}

export async function swapWidgetsConfig(
	projectId: string,
	widgetIdA: string,
	widgetIdB: string,
	newConfigA: any,
	newConfigB: any,
) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const own = await prisma.project.findFirst({
			where: { id: projectId, userId: session.user.id },
			select: { id: true },
		})
		if (!own) return { success: false, message: "Project not found" }

		await prisma.$transaction([
			prisma.widget.update({
				where: { id: widgetIdA },
				data: { config: newConfigA },
			}),
			prisma.widget.update({
				where: { id: widgetIdB },
				data: { config: newConfigB },
			}),
		])

		revalidateTag(`projects:${session.user.id}`, "max")
		revalidateTag(`project:${projectId}`, "max")
		revalidateTag(`project-widget:${projectId}`, "max")
		revalidatePath(`/projects/${projectId}`)

		return { success: true, message: "Widgets swapped successfully" }
	} catch (error) {
		console.error("swapWidgetsConfig error:", error)
		return { success: false, message: "Failed to swap widget configs" }
	}
}

export async function switchWidgetColumnType(widgetId: string) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const res = await getWidgetById(widgetId)
		if (!res.success || !res.widget)
			return { success: res.success, message: res.message }

		const own = await prisma.project.findFirst({
			where: { id: res.widget.projectId, userId: session.user.id },
			select: { id: true },
		})
		if (!own) return { success: false, message: "Project not found" }

		const prev = (res.widget.config as any) || {}
		const newConfig = { ...prev, fullColumn: !Boolean(prev.fullColumn) }

		await prisma.widget.update({
			where: { id: widgetId },
			data: { config: newConfig },
		})

		revalidateTag(`projects:${session.user.id}`, "max")
		revalidateTag(`project:${res.widget.projectId}`, "max")
		revalidateTag(`project-widgets:${res.widget.projectId}`, "max")
		revalidatePath(`/projects/${res.widget.projectId}`)

		return { success: true, message: "Widget column type switched", widgetId }
	} catch (error) {
		console.error("Error switching widget column type:", error)
		return { success: false, message: "Failed to switch widget column type" }
	}
}

export async function deleteWidget(widgetId: string) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const res = await getWidgetById(widgetId)
		if (!res.success || !res.widget)
			return { success: res.success, message: res.message }

		const own = await prisma.project.findFirst({
			where: { id: res.widget.projectId, userId: session.user.id },
			select: { widgetsOrder: true },
		})
		if (!own) return { success: false, message: "Project not found" }

		const updatedOrder = own.widgetsOrder.filter((id) => id !== widgetId)
		await prisma.project.update({
			where: { id: res.widget.projectId },
			data: { widgetsOrder: updatedOrder },
		})

		await prisma.widget.delete({ where: { id: widgetId } })

		revalidateTag(`projects:${session.user.id}`, "max")
		revalidateTag(`project:${res.widget.projectId}`, "max")
		revalidateTag(`project-widget:${res.widget.projectId}`, "max")
		revalidatePath(`/projects/${res.widget.projectId}`)

		return { success: true, message: "Widget deleted successfully" }
	} catch (error) {
		console.error("Error deleting widget:", error)
		return { success: false, message: "Failed to delete widget" }
	}
}

export async function createNotesWidget(projectId: string, content: string) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const project = await prisma.project.findFirst({
			where: { id: projectId, userId: session.user.id },
			select: { widgetsOrder: true },
		})
		if (!project) return { success: false, message: "Project not found" }

		const widget = await prisma.widget.create({
			data: {
				config: { fullColumn: true, content },
				projectId,
				type: "notes",
			},
		})

		const order = [...project.widgetsOrder, widget.id]
		await prisma.project.update({
			where: { id: projectId },
			data: { widgetsOrder: order },
		})

		revalidateTag(`projects:${session.user.id}`, "max")
		revalidateTag(`project:${projectId}`, "max")
		revalidateTag(`project-widgets:${projectId}`, "max")
		revalidatePath(`/projects/${projectId}`)

		return {
			success: true,
			message: "Notes widget created successfully",
			widgetId: widget.id,
		}
	} catch (error) {
		console.error("Error creating notes widget:", error)
		return { success: false, message: "Failed to create notes widget" }
	}
}

export async function updateNotesWidget(
	widgetId: string,
	projectId: string,
	content: string,
) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const widget = await prisma.widget.findFirst({
			where: { id: widgetId, projectId },
			select: { config: true },
		})
		if (!widget) return { success: false, message: "Widget not found" }

		const prev = (widget.config as any) || {}
		const newConfig = { ...prev, content }

		await prisma.widget.update({
			where: { id: widgetId },
			data: { config: newConfig },
		})

		revalidateTag(`projects:${session.user.id}`, "max")
		revalidateTag(`project:${projectId}`, "max")
		revalidateTag(`project-widgets:${projectId}`, "max")
		revalidatePath(`/projects/${projectId}`)

		return { success: true, message: "Notes widget updated successfully" }
	} catch (error) {
		console.error("Error updating notes widget:", error)
		return { success: false, message: "Failed to update notes widget" }
	}
}
