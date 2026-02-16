"use server"

import { prisma } from "@/lib/prisma"
import { createProjectSchema } from "@/lib/schemas/projectSchema"
import { GetSession } from "@/lib/session"
import { nanoid } from "nanoid"
import { revalidatePath, revalidateTag } from "next/cache"
import * as z from "zod"

export async function createProject(
	userId: string,
	data: z.infer<typeof createProjectSchema>,
) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }
		if (session.user.id !== userId)
			return { success: false, message: "Forbidden" }

		const project = await prisma.project.create({
			data: {
				name: data.name,
				description: data.description,
				userId,
			},
		})

		revalidateTag(`projects:${userId}`, "max")
		revalidatePath("/projects")

		return {
			success: true,
			message: "Project created successfully",
			projectId: project.id,
		}
	} catch (error) {
		console.error("Error creating project:", error)
		return { success: false, message: "Failed to create project" }
	}
}

export async function getProjectsNames(userId: string) {
	try {
		const projects = await prisma.project.findMany({
			where: { userId },
			select: { id: true, name: true },
		})
		return { success: true, projects }
	} catch (error) {
		console.error("Error getting projects names:", error)
		return { success: false, message: "Failed to get projects names" }
	}
}

export async function updateProject(
	projectId: string,
	data: z.infer<typeof createProjectSchema>,
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

		const updated = await prisma.project.update({
			where: { id: projectId },
			data: { name: data.name, description: data.description },
		})

		revalidateTag(`projects:${session.user.id}`, "max")
		revalidateTag(`project:${projectId}`, "max")
		revalidatePath(`/projects/${projectId}/settings`)
		revalidatePath(`/projects/${projectId}`)
		revalidatePath("/projects")

		return {
			success: true,
			message: "Project updated successfully",
			project: updated.id,
		}
	} catch (error) {
		console.error("Error updating project:", error)
		return { success: false, message: "Failed to update project" }
	}
}

export async function updateProjectWidgetsOrder(
	projectId: string,
	widgetsOrder: string[],
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

		await prisma.project.update({
			where: { id: projectId },
			data: { widgetsOrder },
		})

		// Invalidate cache and re-execute server component to update widgetsOrder
		revalidateTag(`project:${projectId}`, "max")
		revalidatePath(`/projects/${projectId}`)

		return { success: true, message: "Widgets order updated successfully" }
	} catch (error) {
		console.error("Error updating widgets order:", error)
		return { success: false, message: "Failed to update widgets order" }
	}
}

export async function deleteProject(projectId: string) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const own = await prisma.project.findFirst({
			where: { id: projectId, userId: session.user.id },
			select: { id: true },
		})
		if (!own) return { success: false, message: "Project not found" }

		await prisma.project.delete({ where: { id: projectId } })

		revalidateTag(`projects:${session.user.id}`, "max")
		revalidatePath("/projects")

		return { success: true, message: "Project deleted successfully" }
	} catch (error) {
		console.error("Error deleting project:", error)
		return { success: false, message: "Failed to delete project" }
	}
}

export async function toggleProjectPublic(projectId: string) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const own = await prisma.project.findFirst({
			where: { id: projectId, userId: session.user.id },
		})
		if (!own) return { success: false, message: "Project not found" }

		const project = await prisma.project.update({
			where: { id: projectId },
			data: { isPublic: !own.isPublic },
		})

		const resMessage = project.isPublic
			? "The project is now public, link copied to clipboard!"
			: "The project is now private"

		revalidateTag(`project:${projectId}`, "max")
		revalidatePath(`/projects`)
		revalidatePath(`/projects/${projectId}`)

		return {
			success: true,
			message: resMessage,
			idPublic: project.idPublic,
			isPublic: project.isPublic,
		}
	} catch (error) {
		console.error("Error toggling project public status:", error)
		return { success: false, message: "Failed to toggle project public status" }
	}
}

export async function regenerateProjectPublicLink(projectId: string) {
	try {
		const session = await GetSession()
		if (!session || !session.user)
			return { success: false, message: "Unauthorized" }

		const own = await prisma.project.findFirst({
			where: { id: projectId, userId: session.user.id },
			select: { id: true },
		})
		if (!own) return { success: false, message: "Project not found" }

		const newIdPublic = nanoid(10)
		const updated = await prisma.project.update({
			where: { id: projectId },
			data: { idPublic: newIdPublic },
		})

		revalidateTag(`project:${projectId}`, "max")
		revalidatePath(`/projects`)
		revalidatePath(`/projects/${projectId}`)

		return {
			success: true,
			message: "Public link regenerated successfully",
			idPublic: updated.idPublic,
		}
	} catch (error) {
		console.error("Error regenerating project public link:", error)
		return { success: false, message: "Failed to regenerate public link" }
	}
}
