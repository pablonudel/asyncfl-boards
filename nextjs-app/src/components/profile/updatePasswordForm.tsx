"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group"
import { authClient } from "@/lib/auth-client"
import { updatePasswordSchema } from "@/lib/schemas/authSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { CircleCheckBig, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

export default function UpdatePasswordForm() {
	const [viewCurrentPassword, setViewCurrentPassword] = useState("password")
	const [viewNewPassword, setViewNewPassword] = useState("password")

	function toggleViewPassword(type: "current" | "new") {
		if (type === "new")
			setViewNewPassword((prev) => (prev === "password" ? "text" : "password"))
		else
			setViewCurrentPassword((prev) =>
				prev === "password" ? "text" : "password"
			)
	}

	const form = useForm<z.infer<typeof updatePasswordSchema>>({
		resolver: zodResolver(updatePasswordSchema),
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
			revokeOtherSessions: true,
		},
	})

	const { isSubmitting } = form.formState

	async function onSubmit(data: z.infer<typeof updatePasswordSchema>) {
		await authClient.changePassword(data, {
			onError(error) {
				toast.error(error.error.message)
			},
			onSuccess() {
				toast.success("Password updated successfully")
				form.reset()
			},
		})
	}

	return (
		<div className='flex flex-col h-full gap-4'>
			<form
				id='update-password-form'
				onSubmit={form.handleSubmit(onSubmit)}
				className='space-y-4 grow'>
				<Controller
					name='currentPassword'
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor='update-password-form-currentPassword'>
								Current Password
							</FieldLabel>
							<InputGroup>
								<InputGroupInput
									{...field}
									type={viewCurrentPassword}
									autoComplete='off'
								/>
								<InputGroupButton
									size='icon-xs'
									aria-label='Show password'
									className='mr-2'
									onClick={() => toggleViewPassword("current")}>
									{viewCurrentPassword === "password" ? <Eye /> : <EyeOff />}
								</InputGroupButton>
							</InputGroup>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
				<Controller
					name='newPassword'
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor='update-password-form-newPassword'>
								New Password
							</FieldLabel>
							<InputGroup>
								<InputGroupInput
									{...field}
									type={viewNewPassword}
									autoComplete='off'
								/>
								<InputGroupButton
									size='icon-xs'
									aria-label='Show password'
									className='mr-2'
									onClick={() => toggleViewPassword("new")}>
									{viewNewPassword === "password" ? <Eye /> : <EyeOff />}
								</InputGroupButton>
							</InputGroup>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
				<Controller
					name='confirmPassword'
					control={form.control}
					render={({ field, fieldState }) => {
						const passwordValue = form.watch("newPassword")
						const isMatching = passwordValue && field.value === passwordValue

						return (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor='update-password-form-confirmPassword'>
									Confirm New Password
								</FieldLabel>
								<InputGroup>
									<InputGroupInput
										{...field}
										type='password'
										autoComplete='off'
										onPaste={(e) => e.preventDefault()}
									/>
									{isMatching && (
										<InputGroupAddon
											align='inline-end'
											className='text-green-500'>
											<CircleCheckBig />
										</InputGroupAddon>
									)}
								</InputGroup>

								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)
					}}
				/>
				<Controller
					name='revokeOtherSessions'
					control={form.control}
					render={({ field }) => (
						<Field>
							<div className='flex items-center '>
								<Checkbox
									id='revokeOtherSessions'
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
								<FieldLabel htmlFor='revokeOtherSessions' className='ml-2'>
									Log out other sessions
								</FieldLabel>
							</div>
						</Field>
					)}
				/>
			</form>
			<Button
				type='submit'
				form='update-password-form'
				className='w-full'
				disabled={isSubmitting}>
				{isSubmitting ? "Updating..." : "Update Password"}
			</Button>
		</div>
	)
}
