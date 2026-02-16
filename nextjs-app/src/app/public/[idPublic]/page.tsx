import PublicProjectDashboard from "@/components/publicProject/publicProjectDashboard"
import { Suspense } from "react"
import Loading from "./loading"

export default async function Page({
	params,
}: {
	params: Promise<{ idPublic: string }>
}) {
	return (
		<Suspense fallback={<Loading />}>
			<PublicProjectDashboard params={params} />
		</Suspense>
	)
}
