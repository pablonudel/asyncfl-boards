import UserMenu from "@/components/auth/userMenu"
import Link from "next/link"
import { Suspense } from "react"
import { Skeleton } from "../ui/skeleton"
import { ModeToggle } from "./modeToggle"

export default async function NavBar({
	isPublic = false,
}: {
	isPublic?: boolean
}) {
	return (
		<div className='flex justify-between items-center p-2 border rounded-full backdrop-blur-2xl'>
			<Link href='/projects' className='ms-4'>
				<p className='font-extrabold'>
					AsyncFL<span className='font-light text-xl'>-</span>
					<span className='font-medium'>Boards</span>
				</p>
			</Link>
			<div className='flex items-center gap-2'>
				{!isPublic && (
					<Suspense fallback={<Skeleton className='h-9 w-9 rounded-full' />}>
						<UserMenu />
					</Suspense>
				)}
				<ModeToggle />
			</div>
		</div>
	)
}
