"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { authClient } from "@/lib/auth-client"
import { DialogClose } from "@radix-ui/react-dialog"
import { UserWithRole } from "better-auth/plugins/admin"
import { MoreVerticalIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu"

export function UserRow({
	user,
	selfId,
}: {
	user: UserWithRole
	selfId: string
}) {
	const { refetch } = authClient.useSession()
	const router = useRouter()
	const isSelf = user.id === selfId

	function handleBanUser(userId: string) {
		authClient.admin.banUser(
			{ userId },
			{
				onError: (error: any) => {
					toast.error(error.error.message || "Failed to ban user")
				},
				onSuccess: () => {
					toast.success("User banned")
					router.refresh()
				},
			},
		)
	}

	function handleUnbanUser(userId: string) {
		authClient.admin.unbanUser(
			{ userId },
			{
				onError: (error: any) => {
					toast.error(error.error.message || "Failed to unban user")
				},
				onSuccess: () => {
					toast.success("User unbanned")
					router.refresh()
				},
			},
		)
	}

	function handleRevokeSessions(userId: string) {
		authClient.admin.revokeUserSessions(
			{ userId },
			{
				onError: (error: any) => {
					toast.error(error.error.message || "Failed to revoke user sessions")
				},
				onSuccess: () => {
					toast.success("User sessions revoked")
				},
			},
		)
	}

	function handleRemoveUser(userId: string) {
		authClient.admin.removeUser(
			{ userId },
			{
				onError: (error: any) => {
					toast.error(error.error.message || "Failed to delete user")
				},
				onSuccess: () => {
					toast.success("User deleted")
					router.refresh()
				},
			},
		)
	}

	return (
		<TableRow key={user.id}>
			<TableCell>
				<div>
					<div className='font-medium'>{user.name || "No name"}</div>
					<div className='text-sm text-muted-foreground'>{user.email}</div>
					<div className='flex items-center gap-2 not-empty:mt-2'>
						{user.banned && <Badge variant='destructive'>Banned</Badge>}
						{!user.emailVerified && <Badge variant='outline'>Unverified</Badge>}
						{isSelf && <Badge>You</Badge>}
					</div>
				</div>
			</TableCell>
			<TableCell>
				<Badge variant={user.role === "admin" ? "default" : "secondary"}>
					{user.role}
				</Badge>
			</TableCell>
			<TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
			<TableCell>
				{!isSelf && (
					<Dialog>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='outline' size='icon' className='rounded-full'>
									<MoreVerticalIcon />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem onClick={() => handleRevokeSessions(user.id)}>
									Revoke Sessions
								</DropdownMenuItem>
								{user.banned ? (
									<DropdownMenuItem onClick={() => handleUnbanUser(user.id)}>
										Unban User
									</DropdownMenuItem>
								) : (
									<DropdownMenuItem onClick={() => handleBanUser(user.id)}>
										Ban User
									</DropdownMenuItem>
								)}
								<DropdownMenuSeparator />
								<DialogTrigger asChild>
									<DropdownMenuItem variant='destructive'>
										Delete User
									</DropdownMenuItem>
								</DialogTrigger>
							</DropdownMenuContent>
						</DropdownMenu>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Confirm Deletion</DialogTitle>
							</DialogHeader>
							<p>
								Are you sure you want to delete this user? This action cannot be
								undone.
							</p>
							<DialogFooter>
								<DialogClose asChild>
									<Button variant='outline' type='button'>
										Cancel
									</Button>
								</DialogClose>
								<Button
									variant='destructive'
									onClick={() => handleRemoveUser(user.id)}>
									Delete
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				)}
			</TableCell>
		</TableRow>
	)
}
