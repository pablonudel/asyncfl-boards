"use server"
import { prisma } from "@/lib/prisma"
import { cacheTag } from "next/cache"

/**
 * Fetches the projects associated with a specific user from the database.
 * @param userId
 * @returns An object containing the success status and either the list of projects or an error message.
 */
export async function getUserProjects(userId: string) {
	"use cache: remote"
	cacheTag(`projects:${userId}`)
	try {
		const res = await prisma.user.findMany({
			where: { id: userId },
			select: { projects: true },
		})
		const projects = res.flatMap((user) => user.projects)
		return { success: true, projects }
	} catch (error) {
		console.error("Error fetching user projects:", error)
		return { success: false, message: "Error fetching user projects" }
	}
}

/**
 * Fetches a specific project by its ID for a given user from the database.
 * @param projectId
 * @param userId
 * @returns	An object containing the success status and either the project details or an error message.
 */
export async function getUserProjectById(projectId: string, userId: string) {
	"use cache: remote"
	cacheTag(`project:${projectId}`)
	try {
		const project = await prisma.project.findFirst({
			where: { id: projectId, userId: userId },
		})
		if (!project) {
			return { success: false, message: "Project not found" }
		}

		// Convertir fechas de strings a Date objects después del cache
		const projectWithDates = {
			...project,
			createdAt: new Date(project.createdAt),
			updatedAt: new Date(project.updatedAt),
		}

		return { success: true, project: projectWithDates }
	} catch (error) {
		console.error("Error getting project by ID:", error)
		return { success: false, message: "Failed to get project" }
	}
}

/**
 * Fetches the widgets associated with a specific project for a given user from the database.
 * @param projectId
 * @param userId
 * @returns An object containing the success status and either the list of widgets or an error message.
 */
export async function getWidgetsByProjectId(projectId: string, userId: string) {
	"use cache: remote"
	cacheTag(`project-widgets:${projectId}`)
	try {
		const project = await prisma.project.findFirst({
			where: { id: projectId, userId: userId },
			select: { widgets: true },
		})
		if (!project) {
			return { success: false, message: "Project not found" }
		}

		// Convertir fechas de strings a Date objects después del cache
		const widgets = project.widgets.map((widget) => ({
			...widget,
			createdAt: new Date(widget.createdAt),
			updatedAt: new Date(widget.updatedAt),
		}))

		return { success: true, widgets }
	} catch (error) {
		console.error("Error getting project widgets by project ID:", error)
		return { success: false, message: "Failed to get project widgets" }
	}
}

/**
 * Fetches a specific public project by its public ID from the database.
 * @param idPublic
 * @returns An object containing the success status and either the project details or an error message.
 */
export async function getProjectByIdPublic(idPublic: string) {
	try {
		const project = await prisma.project.findFirst({
			where: { idPublic: idPublic, isPublic: true },
		})
		if (!project) {
			return { success: false, message: "Project not found" }
		}

		return { success: true, project }
	} catch (error) {
		console.error("Error getting project by public ID:", error)
		return { success: false, message: "Failed to get project by public ID" }
	}
}
