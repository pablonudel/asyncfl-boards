"use client"

import {
	createProject,
	updateProject,
} from "@/actions/projects/crudProjects.actions"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { authClient } from "@/lib/auth-client"
import { createProjectSchema } from "@/lib/schemas/projectSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { Field, FieldLabel } from "../ui/field"

type project = {
	id: string
	name: string
	createdAt: Date
	updatedAt: Date
	description: string | null
}

export default function ProjectForm({
	project,
	mode,
	onSuccess,
	userId,
}: {
	project?: project
	mode: "create" | "edit"
	onSuccess?: () => void
	userId?: string
}) {
	const { data: session } = authClient.useSession()

	const form = useForm({
		resolver: zodResolver(createProjectSchema),
		defaultValues: {
			name: project?.name ?? "",
			description: project?.description ?? "",
		},
	})

	async function onSubmit(data: z.infer<typeof createProjectSchema>) {
		if (mode === "edit" && project) {
			const res = await updateProject(project.id, data)
			if (!res.success) {
				toast.error(res.message)
			} else {
				toast.success(res.message)
			}
			onSuccess?.()
		} else if (mode === "create" && userId) {
			const res = await createProject(userId, data)
			if (!res.success) {
				toast.error(res.message)
			} else {
				toast.success(res.message)
				form.reset()
				onSuccess?.()
			}
		}
	}

	return (
		<form
			id='createProjectForm'
			onSubmit={form.handleSubmit(onSubmit)}
			className='space-y-4'>
			<button className='sr-only' aria-hidden='true'></button>
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
