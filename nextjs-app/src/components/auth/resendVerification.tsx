"use client"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { MailCheck } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Badge } from "../ui/badge"

export default function ResendVerification({ email }: { email: string }) {
	const interval = useRef<NodeJS.Timeout>(undefined)
	const [timeToNextResend, setTimeToNextResend] = useState(30)

	useEffect(() => {
		startResendCountDown()
	}, [])

	function startResendCountDown(time = 30) {
		setTimeToNextResend(time)
		interval.current = setInterval(() => {
			setTimeToNextResend((prev) => {
				const newTime = prev - 1

				if (newTime <= 0) {
					clearInterval(interval.current)
					return 0
				}
				return newTime
			})
		}, 1000)
	}

	function handleResendVerificationEmail(email: string) {
		startResendCountDown()
		authClient.sendVerificationEmail({ email, callbackURL: "/projects" })
	}
	return (
		<div className='text-center'>
			<MailCheck size={48} strokeWidth={1} className='mx-auto' />
			<h2 className='font-bold text-xl mb-6'>Verify Your Email</h2>
			<p className='text-sm mb-2'>A verification email has been sent to:</p>
			<Badge variant='outline' className='mb-2 text-md'>
				{email}
			</Badge>
			<p className='mb-6 max-w-sm mx-auto text-sm'>
				Please check your inbox and follow the instructions to verify your
				account.
			</p>
			<Button
				variant='secondary'
				onClick={() => handleResendVerificationEmail(email)}
				disabled={timeToNextResend > 0}>
				{timeToNextResend > 0
					? `Resend Email (${timeToNextResend})`
					: "Resend Email"}
			</Button>
		</div>
	)
}
