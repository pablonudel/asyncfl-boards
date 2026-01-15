"use client"

import { authClient } from "@/lib/auth-client"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DropdownMenuItem } from "../ui/dropdown-menu"

export default function SignOutItem() {
	const router = useRouter()
	const { refetch } = authClient.useSession()
	async function handleSignOut() {
		await authClient.signOut({
			fetchOptions: {
				onError: (ctx) => {
					toast.error(ctx.error.message)
				},
				onSuccess: async () => {
					await refetch()
					router.push("/")
				},
			},
		})
	}
	return (
		<DropdownMenuItem onClick={handleSignOut}>
			<LogOut />
			Log out
		</DropdownMenuItem>
	)
}
