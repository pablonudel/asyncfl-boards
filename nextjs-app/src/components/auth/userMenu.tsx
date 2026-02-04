import { getUserSession } from "@/actions/auth/auth.actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

	const avatarPath = `${process.env.STORAGE_PATH_BASE}/${user.id}/${user.image}`

	return (
		<div className='flex gap-2 items-center'>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Avatar className='h-9 w-9 cursor-default'>
						<AvatarImage
							src={avatarPath || undefined}
							alt={user.name}
							className='object-cover'
						/>
						<AvatarFallback className='font-bold'>{`${user.firstName
							.charAt(0)
							.toUpperCase()}${user.lastName
							.charAt(0)
							.toUpperCase()}`}</AvatarFallback>
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
						<DropdownMenuItem asChild>
							<Link href='/profile'>
								<User />
								Profile
							</Link>
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<SignOutItem />
				</DropdownMenuContent>
			</DropdownMenu>
			<ModeToggle />
		</div>
	)
}
