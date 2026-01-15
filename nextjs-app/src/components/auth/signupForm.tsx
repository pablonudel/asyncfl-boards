"use client"

import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { signupSchema } from "@/lib/schemas/authSchema"
import { applyNameRules } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { CircleCheckBig, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "../ui/button"
import { Field, FieldError, FieldLabel } from "../ui/field"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "../ui/input-group"

export default function SignupForm({
	openEmailVerificationTab,
}: {
	openEmailVerificationTab: (email: string) => void
}) {
	const [viewPassword, setViewPassword] = useState("password")

	function toggleViewPassword() {
		setViewPassword((prev) => (prev === "password" ? "text" : "password"))
	}

	const form = useForm<z.infer<typeof signupSchema>>({
		resolver: zodResolver(signupSchema),
		defaultValues: {
			name: "",
			firstName: "",
			lastName: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	})

	async function onSubmit(data: z.infer<typeof signupSchema>) {
		data.firstName = applyNameRules(data.firstName)
		data.lastName = applyNameRules(data.lastName)
		data.name = `${data.firstName} ${data.lastName}`
		const res = await authClient.signUp.email(
			{ ...data, callbackURL: "/projects" },
			{
				onError(error) {
					toast.error(error.error.message || "Failed to sign up.")
				},
			}
		)

		if (res.error == null && !res.data.user.emailVerified) {
			openEmailVerificationTab(data.email)
		}
	}

	return (
		<form
			id='signup-form'
			onSubmit={form.handleSubmit(onSubmit)}
			className='space-y-4'>
			<Controller
				name='firstName'
				control={form.control}
				render={({ field, fieldState }) => (
					<Field>
						<FieldLabel>First Name</FieldLabel>
						<Input {...field} type='text' />
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<Controller
				name='lastName'
				control={form.control}
				render={({ field, fieldState }) => (
					<Field>
						<FieldLabel>Last Name</FieldLabel>
						<Input {...field} type='text' />
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<Controller
				name='email'
				control={form.control}
				render={({ field, fieldState }) => (
					<Field>
						<FieldLabel>Email</FieldLabel>
						<Input {...field} type='email' />
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<div className='flex gap-4 items-start'>
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
				<Controller
					name='confirmPassword'
					control={form.control}
					render={({ field, fieldState }) => {
						const passwordValue = form.watch("password")
						const isMatching = passwordValue && field.value === passwordValue

						return (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel>Confirm Password</FieldLabel>
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
			</div>
			<Button
				type='submit'
				form='signup-form'
				className='w-full'
				disabled={form.formState.isSubmitting}>
				{form.formState.isSubmitting ? "Signing Up..." : "Sign Up"}
			</Button>
		</form>
	)
}
