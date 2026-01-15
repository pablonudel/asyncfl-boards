"use client"

import { createProject } from "@/actions/projects/crudProjects.actions"
import { Textarea } from "@/components/ui/textarea"
import { authClient } from "@/lib/auth-client"
import { createProjectSchema } from "@/lib/schemas/projectSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { Field, FieldLabel } from "../ui/field"
import { Input } from "../ui/input"

interface CreateProjectFormProps {
	onSuccess?: () => void
}

export default function CreateProjectForm({
	onSuccess,
}: CreateProjectFormProps) {
	const router = useRouter()
	const { data: session, refetch } = authClient.useSession()
	const userId = session?.user?.id as string

	const form = useForm({
		resolver: zodResolver(createProjectSchema),
		defaultValues: {
			name: "",
			description: "",
		},
	})

	async function onSubmit(data: z.infer<typeof createProjectSchema>) {
		const res = await createProject(userId, data)
		if (!res.success) {
			toast.error(res.message)
		} else {
			router.refresh()
			await refetch()
			toast.success(res.message)
			form.reset()
			onSuccess?.()
		}
	}

	return (
		<form
			id='createProjectForm'
			onSubmit={form.handleSubmit(onSubmit)}
			className='space-y-4'>
			<Controller
				name='name'
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor='createProjectForm-name'>Name</FieldLabel>
						<Input {...field} id='createProjectForm-name' autoComplete='off' />
						{fieldState.invalid && <p>{fieldState.error?.message}</p>}
					</Field>
				)}
			/>
			<Controller
				name='description'
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor='createProjectForm-description'>
							Description
						</FieldLabel>
						<Textarea {...field} id='createProjectForm-description' />
					</Field>
				)}
			/>
		</form>
	)
}
