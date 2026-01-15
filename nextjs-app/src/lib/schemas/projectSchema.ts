import { z } from "zod"

export const createProjectSchema = z.object({
	name: z.string().min(1, "Project name is required"),
	description: z.string().optional(),
})

export const editProjectSchema = z.object({
	name: z.string().min(1, "Project name is required"),
	description: z.string().optional(),
})
