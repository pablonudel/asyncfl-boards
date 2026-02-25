import { UserRow } from "@/components/auth/userRow"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { auth } from "@/lib/auth"
import { Users } from "lucide-react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Suspense } from "react"

export default function Page() {
	return (
		<Suspense
			fallback={
				<div className='w-full flex justify-center'>
					<Spinner className='size-8' />
				</div>
			}>
			<AdminPage />
		</Suspense>
	)
}

async function AdminPage() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session || !session.user) return redirect("/login")

	const hasAccess = await auth.api.userHasPermission({
		headers: await headers(),
		body: { permission: { user: ["list"] } },
	})
	if (!hasAccess.success) return redirect("/projects")

	const users = await auth.api.listUsers({
		headers: await headers(),
		query: { limit: 10, sortBy: "createdAt", sortDirection: "desc" },
	})
	return (
		<>
			<h1 className='text-2xl font-bold mb-8'>Users Admin</h1>
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Users className='h-5 w-5' />
						Users ({users.total})
					</CardTitle>
					<CardDescription>
						Manage user accounts, roles, and permissions
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>User</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Created</TableHead>
									<TableHead className='w-25'>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{users.users.map((user) => (
									<UserRow
										key={user.id}
										user={user}
										selfId={session.user!.id}
									/>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</>
	)
}
