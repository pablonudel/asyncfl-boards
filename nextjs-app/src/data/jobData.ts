"use server"

import { prisma } from "@/lib/prisma"

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
