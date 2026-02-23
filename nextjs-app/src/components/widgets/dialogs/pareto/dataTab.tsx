"use client"

import FileUploaderButton from "@/components/projects/fileUploaderButton"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { FileNameMapping } from "@/lib/schemas/generalWidgetsSchemas"
import { Controller, UseFormReturn } from "react-hook-form"

export default function DataTab({
	formData,
	// defaultPlot,
	files,
	projectId,
	userId,
}: {
	formData: UseFormReturn<any>
	// defaultPlot: z.infer<typeof paretoSchema>
	files: FileNameMapping[]
	projectId: string
	userId: string
}) {
	const allowedFiles = files.filter((file) => !file.shape.length)

	return (
		<>
			<div className='flex gap-4 mb-4'>
				<Controller
					name='layoutConfig.title'
					control={formData.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel className='block text-sm font-medium'>
								Title
							</FieldLabel>
							<Input {...field} type='text' />
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
				<Controller
					name='layoutConfig.height'
					control={formData.control}
					render={({ field, fieldState }) => (
						<Field className='w-44' data-invalid={fieldState.invalid}>
							<FieldLabel className='block text-sm font-medium'>
								Height (px)
							</FieldLabel>
							<Input {...field} type='number' />
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
			</div>
			<div className='space-y-4'>
				<Controller
					name={`dataConfig.source`}
					control={formData.control}
					render={({ field, fieldState }) => (
						<Field>
							<FieldLabel className='block text-sm font-medium'>
								Source
							</FieldLabel>
							<div className='flex items-center gap-2'>
								{files.length > 0 ? (
									<Select
										onValueChange={(value) => {
											field.onChange(value)
											formData.setValue("dataConfig.source", value)
										}}
										value={field.value}>
										<SelectTrigger className='bg-background grow truncate'>
											<SelectValue placeholder='Select a source file' />
										</SelectTrigger>
										<SelectContent>
											{allowedFiles.map((file) => (
												<SelectItem key={file.fileName} value={file.fileName}>
													<span className='max-w-[320px] sm:max-w-132.5 truncate'>
														{file.referenceName}
													</span>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								) : (
									<Input
										{...field}
										type='text'
										disabled
										value='No files available for this graph'
										className='bg-background grow'
									/>
								)}
								<FileUploaderButton projectId={projectId} />
							</div>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
			</div>
		</>
	)
}
