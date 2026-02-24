import { getUserSession } from "@/actions/auth/auth.actions"
import CreateProjectBtn from "@/components/projects/createProjectBtn"
import ProjectList from "@/components/projects/projectList"
import { Spinner } from "@/components/ui/spinner"
import { Suspense } from "react"

export default async function Page() {
	return (
		<>
			<div className='flex justify-between items-center mb-8'>
				<h1 className='text-2xl font-bold'>Projects</h1>
				<Suspense fallback={<Spinner className='size-4' />}>
					<CreateProjectWrapper />
				</Suspense>
			</div>
			<Suspense
				fallback={
					<div className='flex items-center justify-center'>
						<Spinner className='size-8' />
					</div>
				}>
				<ProjectList />
			</Suspense>
		</>
	)
}

async function CreateProjectWrapper() {
	const session = await getUserSession()
	if (!session.user) return null
	const user = session.user

	return <CreateProjectBtn mode='create' userId={user.id} />
}
