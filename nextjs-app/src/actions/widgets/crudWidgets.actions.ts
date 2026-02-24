"use server"

import type { Widget } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { GetSession } from "@/lib/session"
import { revalidatePath, revalidateTag } from "next/cache"

/**
 * Creates a new scatter widget and adds it to the specified project.
 * @param projectId
 * @param dataConfig
 * @param layoutConfig
 * @param widgetSubtype
 * @returns An object indicating success or failure, along with a message and the new widget ID if successful.
 */
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

/**
 * Updates the configuration of an existing scatter widget.
 * @param widgetId
 * @param dataConfig
 * @param layoutConfig
 * @returns An object indicating success or failure, along with a message.
 */
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

		await prisma.project.update({
			where: { id: res.widget.projectId },
			data: { updatedAt: new Date() },
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

/**
 * Fetches all widgets associated with a given project ID, ordered according to the project's widget order.
 * @param projectId
 * @returns An object indicating success or failure, along with a message and an array of widgets if successful.
 */
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

/**
 * Fetches a single widget by its ID.
 * @param widgetId
 * @returns An object indicating success or failure, along with a message and the widget if successful.
 */
export async function getWidgetById(widgetId: string) {
	try {
		const widget = await prisma.widget.findUnique({ where: { id: widgetId } })
		return { success: true, widget }
	} catch (error) {
		console.error("Error fetching widget by ID:", error)
		return { success: false, message: "Widget not found" }
	}
}

/**
 * Swaps the configurations of two widgets within the same project. This is useful for reordering widgets or changing their layout without altering their underlying data.
 * @param projectId
 * @param widgetIdA
 * @param widgetIdB
 * @param newConfigA
 * @param newConfigB
 * @returns An object indicating success or failure, along with a message.
 */
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

		await prisma.project.update({
			where: { id: projectId },
			data: { updatedAt: new Date() },
		})

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

/**
 * Toggles the column type of a widget between full column and half column. This is useful for adjusting the layout of widgets within a project without changing their content or functionality.
 * @param widgetId
 * @returns An object indicating success or failure, along with a message and the widget ID if successful.
 */
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

/**
 * Deletes a widget by its ID and removes it from the associated project's widget order. This action also triggers cache invalidation for the relevant project and widget tags to ensure that the UI reflects the deletion immediately.
 * @param widgetId
 * @returns An object indicating success or failure, along with a message.
 */
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

/**
 * Creates a new notes widget with the specified content and adds it to the given project. This function also updates the project's widget order to include the new widget and triggers cache invalidation for the relevant project and widget tags to ensure that the UI reflects the new widget immediately.
 * @param projectId
 * @param content
 * @returns An object indicating success or failure, along with a message and the new widget ID if successful.
 */
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

/**
 * Updates the content of an existing notes widget. This function retrieves the current configuration of the widget, updates the content while preserving other configuration properties, and saves the updated configuration back to the database. It also triggers cache invalidation for the relevant project and widget tags to ensure that the UI reflects the updated content immediately.
 * @param widgetId
 * @param projectId
 * @param content
 * @returns An object indicating success or failure, along with a message.
 */
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

		await prisma.project.update({
			where: { id: projectId },
			data: { updatedAt: new Date() },
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
