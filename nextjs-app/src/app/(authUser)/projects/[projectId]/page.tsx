import ProjectDashboard from "@/components/projects/projectDashboard"
import { Suspense } from "react"

export default async function Page({
	params,
}: {
	params: Promise<{ projectId: string }>
}) {
	return (
		<Suspense fallback={<div>Loading project dashboard...</div>}>
			<ProjectDashboard params={params} />
		</Suspense>
	)
}
