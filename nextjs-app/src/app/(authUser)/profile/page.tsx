import {
	getUserSession,
	getUserSessionsList,
} from "@/actions/auth/auth.actions"
import AvatarUploader from "@/components/profile/avatarUploader"
import DeleteAccountDialog from "@/components/profile/deleteAccountDialog"
import ProfileForm from "@/components/profile/profileForm"
import SessionsList from "@/components/profile/sessionsList"
import UpdatePasswordForm from "@/components/profile/updatePasswordForm"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Prettify, Session } from "better-auth"
import { CircleAlert, RotateCcwKey, ShieldUser, UserPen } from "lucide-react"
import { Suspense } from "react"

export default async function Page() {
	return (
		<div className='space-y-4 mb-8'>
			<h1 className='text-2xl font-bold'>Profile</h1>
			<div className='flex flex-col lg:flex-row gap-4 w-full items-start'>
				<div className='w-full lg:max-w-1/4 space-y-4'>
					<AvatarUploader />
					<Suspense fallback={<div>Loading user info...</div>}>
						<UserInfo />
					</Suspense>
				</div>
				<div className='w-full lg:max-w-3/4 space-y-8'>
					<div className='flex flex-col lg:flex-row space-x-4 gap-y-8'>
						<div className='w-full lg:max-w-1/2 '>
							{/* User Information */}

							<Card className='w-full h-full'>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<UserPen />
										<h2 className='text-lg font-medium'>User Information</h2>
									</CardTitle>
									<CardDescription>
										Update your personal information.
									</CardDescription>
								</CardHeader>
								<CardContent className='h-full'>
									<ProfileForm />
								</CardContent>
							</Card>
						</div>
						<div className='w-full lg:max-w-1/2'>
							{/* Account Credentials */}
							<Card className='w-full'>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<ShieldUser />
										<h2 className='text-lg font-medium'>Account Security</h2>
									</CardTitle>
									<CardDescription>
										Update your password for enhanced account security.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<UpdatePasswordForm />
								</CardContent>
							</Card>
						</div>
					</div>
					{/* Sessions Management */}
					<div className='flex items-center gap-2 mb-4'>
						<RotateCcwKey />
						<h2 className='text-lg font-medium'>Sessions Management</h2>
					</div>
					<Suspense fallback={<div>Loading sessions...</div>}>
						<SessionManagement />
					</Suspense>
					<Separator className='my-4' />
					{/* Danger Zone */}
					<div className='space-y-1 mb-4'>
						<div className='flex items-center gap-2 text-destructive'>
							<CircleAlert />
							<h2 className='text-lg font-medium'>Account Deletion</h2>
						</div>
						<p className='text-muted-foreground text-sm'>
							By deleting your account, you will lose all your data permanently,
							including your projects and settings. <br /> This action is
							irreversible. Please proceed with caution.
						</p>
					</div>
					<DeleteAccountDialog />
				</div>
			</div>
		</div>
	)
}

async function UserInfo() {
	const session = await getUserSession()
	if (!session.user) return null
	const user = session.user
	const createdAt = new Date(user.createdAt)
	const updatedAt = new Date(user.updatedAt)

	return (
		<div className='space-y-4'>
			<div>
				<h2 className='text-lg font-bold'>{user.name}</h2>
				<p className='text-sm'>{user.email}</p>
			</div>
			{createdAt.getTime() !== updatedAt.getTime() && (
				<p className='text-xs text-muted-foreground'>
					Last update:
					<br /> {updatedAt.toLocaleString()}
				</p>
			)}
		</div>
	)
}

async function SessionManagement() {
	const promises = [getUserSession(), getUserSessionsList()]
	const results = await Promise.all(promises)

	const session = results[0] as Prettify<Session>
	const sessionsList = results[1] as Prettify<Session>[]

	const sessionToken = session.token
	const otherSessions = sessionsList.filter((s) => s.token !== sessionToken)
	const currentSession = sessionsList.find((s) => s.token === sessionToken)

	return (
		<SessionsList
			currentSession={currentSession as Prettify<Session>}
			otherSessions={otherSessions}
		/>
	)
}
