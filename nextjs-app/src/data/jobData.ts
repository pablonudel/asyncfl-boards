"use server"

import { prisma } from "@/lib/prisma"

/**
 * Fetches the jobs associated with a specific user from the database.
 * @param userId
 * @returns An object containing the success status and either the list of jobs or an error message.
 */
export async function getUserJobs(userId: string) {
	try {
		const jobs = await prisma.job.findMany({
			where: { userId },
		})
		return { success: true, jobs }
	} catch (error) {
		console.error("Error fetching jobs:", error)
		return { success: false, message: "Failed to fetch jobs" }
	}
}

/**
 * Fetches a specific job by its ID for a given user from the database.
 * @param userId
 * @param jobId
 * @returns An object containing the success status and either the job details or an error message.
 */
export async function getUserJobById(userId: string, jobId: string) {
	try {
		const job = await prisma.job.findUnique({
			where: { id: jobId, userId },
		})
		return { success: true, job }
	} catch (error) {
		console.error("Error fetching job by ID:", error)
		return { success: false, message: "Failed to fetch job by ID" }
	}
}
