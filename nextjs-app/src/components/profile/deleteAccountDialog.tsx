"use client"

import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import type { User } from "@/generated/prisma/client"
import { authClient } from "@/lib/auth-client"
import { Loader2Icon } from "lucide-react"
import { redirect } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export default function DeleteAccountDialog() {
	const { data: session } = authClient.useSession()
	const user: User = session?.user as User

	const [isSubmitting, setIsSubmitting] = useState(false)

	async function handleDeleteAccount() {
		setIsSubmitting(true)
		const res = authClient.deleteUser({ callbackURL: "/" })
		if (!(await res).data?.success) {
			toast.error((await res).error?.message)
			setIsSubmitting(false)
		} else {
			toast.success((await res).data?.message)
			redirect("/")
		}
	}
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant='destructive'>Delete Account</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Are you absolutely sure?</DialogTitle>
					<DialogDescription>
						This action cannot be undone. This will permanently delete your
						account, associated projects, and remove any related data from our
						servers.
					</DialogDescription>
				</DialogHeader>
				<form action={handleDeleteAccount}>
					<Button
						variant='destructive'
						type='submit'
						className='w-full'
						disabled={isSubmitting}>
						{isSubmitting && <Loader2Icon className='animate-spin' />}
						{isSubmitting ? "Deleting Account..." : "Yes, delete my account"}
					</Button>
				</form>
				<DialogClose asChild>
					<Button variant='outline'>Cancel</Button>
				</DialogClose>
			</DialogContent>
		</Dialog>
	)
}
