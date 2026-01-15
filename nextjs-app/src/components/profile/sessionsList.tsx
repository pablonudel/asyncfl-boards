"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { Prettify, Session } from "better-auth"
import { Monitor, Smartphone, Trash } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { UAParser } from "ua-parser-js"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Spinner } from "../ui/spinner"

export default function SessionsList({
	currentSession,
	otherSessions,
}: {
	currentSession: Session
	otherSessions: Session[]
}) {
	const router = useRouter()
	const [isSubmitting, setIsSubmitting] = useState(false)

	function revokeOtherSessions() {
		setIsSubmitting(true)
		return authClient.revokeOtherSessions(undefined, {
			onSuccess() {
				router.refresh()
			},
		})
	}

	return (
		<div className='space-y-4'>
			{currentSession && <SessionCard session={currentSession} isCurrent />}
			{otherSessions.length === 0 ? (
				<div className='text-center'>
					<Badge variant='secondary'>No other active sessions found</Badge>
				</div>
			) : (
				<div className='flex justify-between items-center'>
					<h3>Other Active Sessions</h3>
					<Button
						variant='destructive'
						size='sm'
						onClick={revokeOtherSessions}
						disabled={isSubmitting}
						className='min-w-52 text-center'>
						{isSubmitting ? <Spinner /> : "Revoke All Other Sessions"}
					</Button>
				</div>
			)}
			{otherSessions.map((session) => (
				<SessionCard key={session.id} session={session} isCurrent={false} />
			))}
		</div>
	)
}

function SessionCard({
	session,
	isCurrent = false,
}: {
	session: Prettify<Session>
	isCurrent: boolean
}) {
	const router = useRouter()
	const userAgentInfo = session.userAgent ? UAParser(session.userAgent) : null
	const [isSubmitting, setIsSubmitting] = useState(false)

	function revokeSession() {
		setIsSubmitting(true)
		return authClient.revokeSession(
			{
				token: session.token,
			},
			{
				onSuccess() {
					router.refresh()
				},
			}
		)
	}

	function getBrowserInfo() {
		if (!userAgentInfo) return "Unknown Device"
		if (!userAgentInfo.browser.name && !userAgentInfo.os.name)
			return "Unknown Device"

		if (!userAgentInfo.browser.name) return userAgentInfo.os.name
		if (!userAgentInfo.os.name) return userAgentInfo.browser.name

		return `${userAgentInfo.browser.name} on ${userAgentInfo.os.name}`
	}

	function formatDate(date: Date) {
		return new Intl.DateTimeFormat(undefined, {
			dateStyle: "medium",
			timeStyle: "short",
		}).format(new Date(date))
	}
	return (
		<Card>
			<CardHeader className='flex justify-between'>
				<CardTitle>{getBrowserInfo()}</CardTitle>
				{isCurrent && <Badge>Current Session</Badge>}
			</CardHeader>
			<CardContent>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						{userAgentInfo?.device.type === "mobile" ? (
							<Smartphone />
						) : (
							<Monitor />
						)}
						<div>
							<p className='text-sm text-muted-foreground'>
								Created: {formatDate(session.createdAt)}
							</p>
							<p className='text-sm text-muted-foreground'>
								Expires: {formatDate(session.expiresAt)}
							</p>
						</div>
					</div>
					{!isCurrent && (
						<Button
							variant='destructive'
							size='sm'
							onClick={revokeSession}
							disabled={isSubmitting}>
							{isSubmitting ? <Spinner /> : <Trash />}
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
