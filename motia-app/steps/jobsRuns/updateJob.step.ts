import { ApiRouteConfig, Handlers } from "motia"
import { z } from "zod"
import { db } from "../../src/lib/db"

const UpdateJobInputSchema = z.object({
	userId: z.uuid(),
	jobId: z.uuid(),
	name: z.string().min(1),
	description: z.string().optional(),
})

export const config: ApiRouteConfig = {
	name: "Update Job",
	type: "api",
	path: "/api/update-job",
	bodySchema: UpdateJobInputSchema,
	method: "POST",
	emits: [],
	flows: ["Jobs Management"],
}

export const handler: Handlers["Create Job"] = async (
	req: any,
	{ logger }: any,
) => {
	const { userId, jobId, name, description } = req.body

	try {
		const updatedJob = await db
			.updateTable("Job")
			.set({
				updatedAt: new Date(),
				name: name,
				description: description || null,
			})
			.where("id", "=", jobId)
			.where("userId", "=", userId)
			.returning(["id", "name", "description"])
			.executeTakeFirst()

		if (!updatedJob) {
			return {
				status: 404,
				body: {
					success: false,
					message: "Job not found",
				},
			}
		}

		return {
			status: 200,
			body: {
				success: true,
				message: "Job updated successfully",
				job: updatedJob,
			},
		}
	} catch (error: any) {
		// Loguea el error completo para debugging
		logger.error("Error:", error)

		return {
			status: 500,
			body: {
				success: false,
				message: "An error occurred while updating the job",
			},
		}
	}
}
