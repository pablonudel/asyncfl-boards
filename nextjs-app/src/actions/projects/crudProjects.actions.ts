"use server"

import { prisma } from "@/lib/prisma"
import { createProjectSchema } from "@/lib/schemas/projectSchema"
import { GetSession } from "@/lib/session"
import { nanoid } from "nanoid"
import { revalidatePath, revalidateTag } from "next/cache"
import * as z from "zod"

/**
 * Creates a new project for the specified user with the provided data.
 * @param userId
 * @param data
 * @returns An object indicating the success status, a message, and the ID of the created project if successful.
 */
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

/**
 * Retrieves the names and IDs of all projects associated with the specified user.
 * @param userId
 * @returns An object indicating the success status, a message if applicable, and an array of projects with their IDs and names if successful.
 */
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

/**
 * Updates the name and description of a project with the specified ID using the provided data, ensuring that the user is authorized to make changes to the project.
 * @param projectId
 * @param data
 * @returns An object indicating the success status, a message, and the ID of the updated project if successful.
 */
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

/**
 * Updates the order of widgets in a project with the specified ID using the provided array of widget IDs, ensuring that the user is authorized to make changes to the project.
 * @param projectId
 * @param widgetsOrder
 * @returns An object indicating the success status and a message if applicable, indicating whether the widgets order was updated successfully or if there was an error during the update process.
 */
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

/**
 * Deletes a project with the specified ID, ensuring that the user is authorized to delete the project and that the project exists before attempting to delete it. After successful deletion, it invalidates relevant cache tags and paths to ensure that the UI reflects the changes.
 * @param projectId
 * @returns An object indicating the success status and a message if applicable, indicating whether the project was deleted successfully or if there was an error during the deletion process.
 */
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

/**
 * Toggles the public status of a project with the specified ID, ensuring that the user is authorized to make changes to the project and that the project exists before attempting to toggle its public status. After successfully toggling the public status, it invalidates relevant cache tags and paths to ensure that the UI reflects the changes, and returns an object indicating the success status, a message about the new public status, and the updated public link information if applicable.
 * @param projectId
 * @returns An object indicating the success status, a message about the new public status, and the updated public link information if applicable.
 */
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

/**
 * Regenerates the public link of a project with the specified ID, ensuring that the user is authorized to make changes to the project and that the project exists before attempting to regenerate its public link. After successfully regenerating the public link, it invalidates relevant cache tags and paths to ensure that the UI reflects the changes, and returns an object indicating the success status, a message about the successful regeneration of the public link, and the new public link information if applicable.
 * @param projectId
 * @returns An object indicating the success status, a message about the successful regeneration of the public link, and the new public link information if applicable.
 */
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
