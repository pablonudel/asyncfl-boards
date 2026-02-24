"use client"

import { Button } from "@/components/ui/button"
import type { User as UserType } from "@/generated/prisma/client"
import { authClient } from "@/lib/auth-client"
import { updateProfileSchema } from "@/lib/schemas/authSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { Field, FieldError, FieldLabel } from "../ui/field"
import { Input } from "../ui/input"

export default function ProfileForm() {
	const router = useRouter()
	const { data: session, refetch } = authClient.useSession()

	const [user, setUser] = useState<z.infer<typeof updateProfileSchema> | null>(
		null,
	)

	const form = useForm<z.infer<typeof updateProfileSchema>>({
		resolver: zodResolver(updateProfileSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
		},
	})

	const { isSubmitting, isLoading } = form.formState

	useEffect(() => {
		if (session?.user) {
			const userData = session.user as UserType
			const userInfo = {
				firstName: userData.firstName || "",
				lastName: userData.lastName || "",
				email: userData.email || "",
			}
			setUser(userInfo)
			form.reset({
				firstName: userInfo.firstName || "",
				lastName: userInfo.lastName || "",
				email: userInfo.email || "",
			})
		}
	}, [session, form])

	if (!session || !session.user) return null

	async function onSubmit(data: z.infer<typeof updateProfileSchema>) {
		const promises = [
			authClient.updateUser({
				firstName: data.firstName,
				lastName: data.lastName,
			}),
		]
		if (data.email !== user?.email) {
			promises.push(
				authClient.changeEmail({
					newEmail: data.email,
					callbackURL: "/profile",
				}),
			)
		}
		const results = await Promise.all(promises)
		const updateResult = results[0]
		const emailResult = results[1] ?? { error: false }
		if (updateResult.error) {
			toast.error(updateResult.error.message)
		} else if (emailResult.error) {
			toast.error(emailResult.error.message)
		} else {
			if (data.email !== user?.email) {
				toast.success(
					"Please verify your new email address to complete the change.",
				)
			} else {
				toast.success("Profile updated successfully.")
			}
			router.refresh()
		}
	}

	return (
		<div className='flex flex-col h-full gap-4'>
			<form
				id='profile-form'
				onSubmit={form.handleSubmit(onSubmit)}
				className='space-y-4 grow'>
				<Controller
					name='firstName'
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor='profile-form-firstName'>
								First Name
							</FieldLabel>
							<Input
								{...field}
								id='profile-form-firstName'
								aria-invalid={fieldState.invalid}
								autoComplete='off'
							/>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
				<Controller
					name='lastName'
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor='profile-form-lastName'>Last Name</FieldLabel>
							<Input
								{...field}
								id='profile-form-lastName'
								aria-invalid={fieldState.invalid}
								autoComplete='off'
							/>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
				<Controller
					name='email'
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor='profile-form-email'>Email</FieldLabel>
							<Input
								{...field}
								id='profile-form-email'
								aria-invalid={fieldState.invalid}
								autoComplete='off'
							/>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
			</form>
			<Button
				type='submit'
				form='profile-form'
				className='w-full'
				disabled={isSubmitting}>
				{isSubmitting ? "Updating..." : "Update Profile"}
			</Button>
		</div>
	)
}
