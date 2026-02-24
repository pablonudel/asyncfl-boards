import ProjectDashboard from "@/components/projects/projectDashboard"
import { Spinner } from "@/components/ui/spinner"
import { Suspense } from "react"

export default async function Page({
	params,
}: {
	params: Promise<{ projectId: string }>
}) {
	return (
		<Suspense
			fallback={
				<div className='flex items-center justify-center'>
					<Spinner className='size-8' />
				</div>
			}>
			<ProjectDashboard params={params} />
		</Suspense>
	)
}
