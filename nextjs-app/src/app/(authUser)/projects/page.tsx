import CreateProjectDialog from "@/components/projects/createProjectDialog"
import ProjectList from "@/components/projects/projectList"
import { Suspense } from "react"

type project = {
	id: string
	name: string
	createdAt: Date
	updatedAt: Date
	description: string | null
}

export default async function Page() {
	return (
		<>
			<div className='flex justify-between items-center mb-8'>
				<h1 className='text-2xl font-bold'>Projects</h1>
				<CreateProjectDialog />
			</div>
			<Suspense fallback={<div>Loading projects...</div>}>
				<ProjectList />
			</Suspense>
		</>
	)
}
