import { prisma } from "@/lib/prisma"

export async function checkJobsActiveRuns(jobId: string) {
	try {
		const run = await prisma.run.findFirst({
			where: {
				jobId: jobId,
				status: { in: ["PREPARING", "QUEUED", "RUNNING"] },
			},
		})
		return { success: true, isActive: !!run }
	} catch (error) {
		console.error("Error checking run active status:", error)
		return { success: false, message: "Failed to check run active status" }
	}
}
