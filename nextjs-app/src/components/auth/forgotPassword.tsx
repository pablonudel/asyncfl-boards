"use client"

import { authClient } from "@/lib/auth-client"
import { signinSchema } from "@/lib/schemas/authSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "../ui/button"
import { Field, FieldError, FieldLabel } from "../ui/field"
import { Input } from "../ui/input"

const forgotPasswordSchema = signinSchema.pick({ email: true })

export default function ForgotPassword({
	openSignInTab,
}: {
	openSignInTab: () => void
}) {
	const form = useForm<z.infer<typeof forgotPasswordSchema>>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: {
			email: "",
		},
	})

	async function onSubmit(data: z.infer<typeof forgotPasswordSchema>) {
		await authClient.requestPasswordReset(
			{
				email: data.email,
				redirectTo: "/auth/reset-password",
			},
			{
				onError(error) {
					toast.error(error.error.message)
				},
				onSuccess() {
					toast.success("Password reset email sent")
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
			<div className='flex gap-2'>
				<Button type='button' variant='secondary' onClick={openSignInTab}>
					Back to Sign In
				</Button>
				<Button
					type='submit'
					form='login-form'
					className='flex-1'
					disabled={form.formState.isSubmitting}>
					{form.formState.isSubmitting ? "Sending..." : "Send Reset Email"}
				</Button>
			</div>
		</form>
	)
}
