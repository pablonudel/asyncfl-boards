"use client"

import { updateProject } from "@/actions/projects/crudProjects.actions"
import type { Project } from "@/generated/prisma/client"
import { editProjectSchema } from "@/lib/schemas/projectSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "../ui/button"
import { Field, FieldError, FieldLabel } from "../ui/field"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"

export default function EditProjectForm({ project }: { project: Project }) {
	const form = useForm<z.infer<typeof editProjectSchema>>({
		resolver: zodResolver(editProjectSchema),
		defaultValues: {
			name: project.name,
			description: project.description ?? "",
		},
	})

	const onSubmit = async (data: z.infer<typeof editProjectSchema>) => {
		const res = await updateProject(project.id, data)
		if (!res.success) {
			toast.error(res.message)
		} else {
			toast.success(res.message)
		}
	}
	return (
		<form
			id='editProjectForm'
			onSubmit={form.handleSubmit(onSubmit)}
			className='space-y-4'>
			<Controller
				name='name'
				control={form.control}
				render={({ field, fieldState }) => (
					<Field>
						<FieldLabel htmlFor='editProjectForm-name'>Name</FieldLabel>
						<Input
							{...field}
							id='editProjectForm-name'
							aria-invalid={fieldState.invalid}
							autoComplete='off'
						/>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<Controller
				name='description'
				control={form.control}
				render={({ field, fieldState }) => (
					<Field>
						<FieldLabel htmlFor='editProjectForm-description'>
							Description
						</FieldLabel>
						<Textarea
							{...field}
							id='editProjectForm-description'
							aria-invalid={fieldState.invalid}
							autoComplete='off'
						/>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<Button variant='default' form='editProjectForm' type='submit'>
				Save
			</Button>
		</form>
	)
}
