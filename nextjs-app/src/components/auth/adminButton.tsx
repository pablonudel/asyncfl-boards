"use client"

import { authClient } from "@/lib/auth-client"
import { ShieldUser } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { DropdownMenuItem, DropdownMenuSeparator } from "../ui/dropdown-menu"

export default function AdminButton() {
	const [hasAdminPermission, setHasAdminPermission] = useState(false)

	useEffect(() => {
		authClient.admin
			.hasPermission({ permission: { user: ["list"] } })
			.then(({ data }) => {
				setHasAdminPermission(data?.success ?? false)
			})
	}, [])

	return (
		hasAdminPermission && (
			<>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href='/admin'>
						<ShieldUser />
						Users Admin
					</Link>
				</DropdownMenuItem>
			</>
		)
	)
}
