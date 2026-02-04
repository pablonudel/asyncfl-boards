"use client"

import { updateFileReferenceName } from "@/actions/files/crudFiles.actions"
import type { File } from "@/generated/prisma/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { Ban, Save, SquarePen } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { Button } from "../ui/button"
import { Field } from "../ui/field"
import { Input } from "../ui/input"

const formSchema = z.object({
	referenceName: z.string().min(1, "Reference name is required"),
})

export default function FileReferenceForm({
	projectId,
	file,
}: {
	projectId: string
	file: File
}) {
	const router = useRouter()
	const [toggle, setToggle] = useState<string>("edit")

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			referenceName: file.referenceName,
		},
	})

	function handleToggle() {
		toggle === "edit" ? setToggle("save") : setToggle("edit")
	}

	async function onSubmit(data: z.infer<typeof formSchema>) {
		try {
			const res = await updateFileReferenceName(
				projectId,
				file.id,
				data.referenceName,
			)
			if (res.success) {
				router.refresh()
				toast.success(res.message)
				setToggle("edit")
			}
		} catch (error) {
			console.error("Error updating file reference:", error)
			toast.error("Failed updating file reference")
		}
	}
	return (
		<form
			id='file-reference-form'
			onSubmit={form.handleSubmit(onSubmit)}
			className='flex items-center gap-4'>
			{toggle === "edit" ? (
				<>
					<span className='text-md font-bold'>{file.referenceName}</span>
					<Button
						variant='ghost'
						size='icon'
						className='rounded-full w-7 h-7'
						onClick={handleToggle}>
						<SquarePen />
					</Button>
				</>
			) : (
				<>
					<Controller
						name='referenceName'
						control={form.control}
						render={({ field, fieldState }) => (
							<Field>
								<Input
									{...field}
									className='w-full text-md font-bold min-w-76'
								/>
							</Field>
						)}
					/>
					<div className='flex items-center gap-1'>
						<Button
							variant='default'
							size='icon'
							className='rounded-full bg-green-700 hover:bg-green-900 text-white w-7 h-7'>
							<Save />
						</Button>
						<Button
							variant='outline'
							size='icon'
							className='rounded-full w-7 h-7'
							onClick={handleToggle}>
							<Ban />
						</Button>
					</div>
				</>
			)}
		</form>
	)
}
