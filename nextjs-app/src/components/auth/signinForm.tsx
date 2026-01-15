"use client"

import { authClient } from "@/lib/auth-client"
import { signinSchema } from "@/lib/schemas/authSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "../ui/button"
import { Field, FieldError, FieldLabel } from "../ui/field"
import { Input } from "../ui/input"
import {
	InputGroup,
	InputGroupButton,
	InputGroupInput,
} from "../ui/input-group"

export default function SigninForm({
	openEmailVerificationTab,
	openForgotPassword,
}: {
	openEmailVerificationTab: (email: string) => void
	openForgotPassword: () => void
}) {
	const router = useRouter()
	const [viewPassword, setViewPassword] = useState("password")

	function toggleViewPassword() {
		setViewPassword((prev) => (prev === "password" ? "text" : "password"))
	}

	const form = useForm<z.infer<typeof signinSchema>>({
		resolver: zodResolver(signinSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	})

	async function onSubmit(data: z.infer<typeof signinSchema>) {
		await authClient.signIn.email(
			{ ...data },
			{
				onError(error) {
					if (error.error.code === "EMAIL_NOT_VERIFIED") {
						openEmailVerificationTab(data.email)
					}
					toast.error(error.error.message || "Failed to sign in.")
				},
				onSuccess() {
					form.reset()
					toast.success("Successfully signed in!")
					router.push("/projects")
				},
			}
		)
	}

	return (
		<form
			id='login-form'
			onSubmit={form.handleSubmit(onSubmit)}
			className='space-y-4'>
			<Controller
				name='email'
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel>Email</FieldLabel>
						<Input {...field} type='email' />
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<Controller
				name='password'
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel>Password</FieldLabel>
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
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<div>
				<Button
					type='submit'
					form='login-form'
					className='w-full'
					disabled={form.formState.isSubmitting}>
					{form.formState.isSubmitting ? "Signing In..." : "Sign In"}
				</Button>
				<div className='text-center'>
					<Button
						variant='link'
						size='sm'
						onClick={openForgotPassword}
						className='text-xs font-normal cursor-pointer text-muted-foreground hover:text-foreground'>
						Forgot Password?
					</Button>
				</div>
			</div>
		</form>
	)
}
