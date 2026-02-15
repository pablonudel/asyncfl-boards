import PublicProjectDashboard from "@/components/publicProject/publicProjectDashboard"
import { Suspense } from "react"

export default async function Page({
	params,
}: {
	params: Promise<{ idPublic: string }>
}) {
	return (
		<Suspense fallback={<div>Loading public project...</div>}>
			<PublicProjectDashboard params={params} />
		</Suspense>
	)
}
