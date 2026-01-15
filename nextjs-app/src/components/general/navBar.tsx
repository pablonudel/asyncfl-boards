import UserMenu from "@/components/auth/userMenu"
import Link from "next/link"
import { Suspense } from "react"

export default async function NavBar() {
	return (
		<div className='flex justify-between items-center p-2 border rounded-full backdrop-blur-2xl'>
			<Link href='/projects' className='ms-4'>
				<p className='font-extrabold'>
					AsyncFL<span className='font-light text-xl'>-</span>
					<span className='font-medium'>Boards</span>
				</p>
			</Link>
			<Suspense fallback={<div>Loading user menu...</div>}>
				<UserMenu />
			</Suspense>
		</div>
	)
}
