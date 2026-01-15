"use client"

import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
	InputGroup,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { signinSchema } from "@/lib/schemas/authSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

const forgotPasswordSchema = signinSchema.pick({ password: true })

export default function Page() {
	return (
		<Suspense fallback={<ResetPasswordFallback />}>
			<ResetPasswordPage />
		</Suspense>
	)
}

function ResetPasswordPage() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const token = searchParams.get("token")
	const error = searchParams.get("error")

	const [viewPassword, setViewPassword] = useState("password")

	function toggleViewPassword() {
		setViewPassword((prev) => (prev === "password" ? "text" : "password"))
	}

	const form = useForm<z.infer<typeof forgotPasswordSchema>>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: {
			password: "",
		},
	})

	async function onSubmit(data: z.infer<typeof forgotPasswordSchema>) {
		if (token == null) return
		await authClient.resetPassword(
			{
				newPassword: data.password,
				token,
			},
			{
				onError(error) {
					toast.error(error.error.message || "Failed to reset password")
				},
				onSuccess() {
					toast.success("Password reset successfully", {
						description: "Redirecting to sign in...",
					})
					setTimeout(() => {
						router.push("/")
					}, 1000)
				},
			}
		)
	}

	if (token == null || error != null) {
		return (
			<div className='flex h-dvh justify-center items-center'>
				<Card className='min-w-sm'>
					<CardHeader>
						<CardTitle>Invalid Reset Link</CardTitle>
						<CardDescription>
							The password reset link is invalid or has expired.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button className='w-full' asChild>
							<Link href='/'>Go to Home</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className='flex h-dvh justify-center items-center'>
			<Card className='min-w-sm'>
				<CardHeader>
					<CardTitle>Reset Password</CardTitle>
				</CardHeader>
				<CardContent>
					<form
						id='reset-password-form'
						onSubmit={form.handleSubmit(onSubmit)}
						className='space-y-4'>
						<Controller
							name='password'
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>New Password</FieldLabel>
									<InputGroup>
										<InputGroupInput
											{...field}
											type={viewPassword}
											autoComplete='off'
										/>
										<InputGroupButton
											size='icon-xs'
											aria-label='Show password'
											className='mr-2'
											onClick={toggleViewPassword}>
											{viewPassword === "password" ? <Eye /> : <EyeOff />}
										</InputGroupButton>
									</InputGroup>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						<Button
							type='submit'
							form='reset-password-form'
							className='w-full'
							disabled={form.formState.isSubmitting}>
							{form.formState.isSubmitting ? "Resetting..." : "Reset Password"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}

function ResetPasswordFallback() {
	return (
		<div className='flex h-dvh justify-center items-center'>
			<Spinner className='size-10' />
		</div>
	)
}
