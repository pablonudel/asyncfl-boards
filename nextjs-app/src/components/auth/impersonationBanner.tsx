"use client"

import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"

export default function ImpersonationBanner() {
	const router = useRouter()
	const { data, refetch } = authClient.useSession()
	if (!data?.session?.impersonatedBy === null) return null

	function handleQuitImpersonation() {
		authClient.admin.stopImpersonating(undefined, {
			onSuccess: () => {
				refetch()
				router.push("/admin")
			},
		})
	}

	return (
		<div className='fixed bottom-4 left-4 z-50'>
			<Button
				onClick={() => handleQuitImpersonation()}
				className='bg-transparent text-white border border-white/20 hover:bg-red-500'>
				Quit Impersonation
			</Button>
		</div>
	)
}
