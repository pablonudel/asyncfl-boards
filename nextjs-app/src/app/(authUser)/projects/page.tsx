import CreateEditProjectWrapper from "@/components/projects/createEditProjectWrapper"
import ProjectList from "@/components/projects/projectList"
import { Suspense } from "react"

export default async function Page() {
	return (
		<>
			<div className='flex justify-between items-center mb-8'>
				<h1 className='text-2xl font-bold'>Projects</h1>
				<Suspense fallback={<div>Loading...</div>}>
					<CreateEditProjectWrapper mode='create' />
				</Suspense>
				{/* <CreateProjectDialog /> */}
			</div>
			<Suspense fallback={<div>Loading projects...</div>}>
				<ProjectList />
			</Suspense>
		</>
	)
}
