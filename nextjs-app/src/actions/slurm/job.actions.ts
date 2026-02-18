import { getUserJobById } from "@/data/jobData"
import { prisma } from "@/lib/prisma"
import { GetSession } from "@/lib/session"
import crypto from "crypto"
import { uploadJobOrReqFile } from "../uploadFile.action"
import { checkJobsActiveRuns } from "./run.actions"

export async function createUserJob(
	userId: string,
	jobName: string,
	jobDescription: string,
) {
	try {
		const newJob = await prisma.job.create({
			data: {
				name: jobName,
				description: jobDescription,
				userId: userId,
			},
		})
		return { success: true, job: newJob }
	} catch (error) {
		console.error("Error creating user job:", error)
		return { success: false, message: "Failed to create user job" }
	}
}

export async function uploadJobFile(
	jobId: string,
	fileType: string,
	formData: FormData,
) {
	const file = formData.get("file") as File | null
	if (!file) {
		return { success: false, message: "No file uploaded" }
	}

	const session = await GetSession()
	if (!session || !session.user) {
		return { success: false, message: "Unauthorized" }
	}

	const { success, message, job } = await getUserJobById(session.user.id, jobId)
	if (!success || !job) {
		return { success: false, message }
	}

	const { isActive } = await checkJobsActiveRuns(jobId)
	if (isActive)
		return {
			success: false,
			message: "Cannot upload files while a run is active for this job",
		}

	try {
		const { success, message, uploadedFile } = await uploadJobOrReqFile(
			file,
			fileType,
			session.user.id,
			job.name,
			job.folderId,
		)
		if (!uploadedFile) {
			return { success: success, message }
		}

		if (fileType === "sourceFile") {
			const currentFiles = job.sourceFiles || []
			const updatedFiles = [
				...new Set([...currentFiles, uploadedFile.fileName]),
			]
			const { success, message, updatedJob } = await updateUserJob(
				session.user.id,
				jobId,
				{ sourceFiles: updatedFiles },
			)
			if (!updatedJob) {
				return { success: success, message: message }
			}
			const isReadyToRun =
				updatedJob.environmentId &&
				updatedJob.sourceFiles &&
				updatedJob.sourceFiles.length > 0
			if (isReadyToRun) await updateJobStatus(session.user.id, jobId, "READY")
		} else {
			const rawEnv = uploadedFile.fileBuffer.toString("utf-8")
			const normalizedEnv = rawEnv
				.split("\n")
				.map((l) => l.trim())
				.filter((l) => l)
				.sort()
				.join("\n")

			const hash = crypto
				.createHash("sha256")
				.update(normalizedEnv)
				.digest("hex")

			const envExists = await prisma.environment.findFirst({
				where: { hashedReqs: hash },
				select: { id: true },
			})

			if (!envExists) {
				const newEnv = await prisma.environment.create({
					data: {
						requirementsContent: rawEnv,
						hashedReqs: hash,
						userId: session.user.id,
					},
				})

				const { success, message, updatedJob } = await updateUserJob(
					session.user.id,
					jobId,
					{ environmentId: newEnv.id },
				)
				if (!success || !updatedJob) {
					return { success: false, message: message }
				}

				const isReadyToRun =
					updatedJob.environmentId &&
					updatedJob.sourceFiles &&
					updatedJob.sourceFiles.length > 0
				if (isReadyToRun) await updateJobStatus(session.user.id, jobId, "READY")
			}
		}
		return {
			success: true,
			message: "File uploaded and job updated successfully",
		}
	} catch (error) {
		console.error("Error uploading job file:", error)
		return { success: false, message: "Failed to upload job file" }
	}
}

export async function updateUserJob(
	userId: string,
	jobId: string,
	updateData: any,
) {
	try {
		const updatedJob = await prisma.job.update({
			where: { id: jobId, userId: userId },
			data: updateData,
		})
		return { success: true, updatedJob }
	} catch (error) {
		console.error("Error updating job:", error)
		return { success: false, message: "Failed to update job" }
	}
}

export async function updateJobStatus(
	userId: string,
	jobId: string,
	status: string,
) {
	try {
		await prisma.job.update({
			where: { id: jobId, userId: userId },
			data: { status: status },
		})
		return { success: true, message: "Job status updated successfully" }
	} catch (error) {
		console.error("Error updating job status:", error)
		return { success: false, message: "Failed to update job status" }
	}
}
