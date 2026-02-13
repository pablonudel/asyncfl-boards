import { getUserSession } from "@/actions/auth/auth.actions"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Files, LayoutGrid, User } from "lucide-react"
import Link from "next/link"
import { ModeToggle } from "../general/modeToggle"
import SignOutItem from "./signOutItem"

export default async function UserMenu() {
	const session = await getUserSession()
	if (!session.user) return null
	const user = session.user

	const userInitials = `${user.firstName.charAt(0).toUpperCase()}${user.lastName.charAt(0).toUpperCase()}`

	return (
		<div className='flex gap-2 items-center'>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Avatar className='h-9 w-9 cursor-default'>
						{user.image ? (
							<AvatarImage
								src={`/api/avatar`}
								alt={user.name}
								className='object-cover'
							/>
						) : (
							<div className='flex items-center justify-center h-9 w-9 font-bold bg-foreground/10'>
								{userInitials}
							</div>
						)}
					</Avatar>
				</DropdownMenuTrigger>
				<DropdownMenuContent className='w-56' align='end'>
					<DropdownMenuLabel className='font-normal'>
						<p className='truncate'>{user.name}</p>
						<p className='truncate text-xs text-muted-foreground'>
							{user.email}
						</p>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem asChild>
							<Link href='/projects'>
								<LayoutGrid />
								Projects
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link href='/files'>
								<Files />
								Files
							</Link>
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuItem asChild>
						<Link href='/profile'>
							<User />
							Profile
						</Link>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<SignOutItem />
				</DropdownMenuContent>
			</DropdownMenu>
			<ModeToggle />
		</div>
	)
}
