"use client"

import FileUploaderButton from "@/components/projects/fileUploaderButton"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { FileNameMapping } from "@/lib/schemas/generalWidgetsSchemas"
import { plotDataSchema } from "@/lib/schemas/scatterWidgetSchema"
import { ChartSpline, Trash } from "lucide-react"
import { Activity, useState } from "react"
import { Controller, useFieldArray, UseFormReturn } from "react-hook-form"
import { z } from "zod"
import HexPicker from "../../hexPicker"

export default function DataTab({
	formData,
	defaultPlot,
	files,
	projectId,
}: {
	formData: UseFormReturn<any>
	defaultPlot: z.infer<typeof plotDataSchema>
	files: FileNameMapping[]
	projectId: string
}) {
	const { fields, append, remove } = useFieldArray({
		control: formData.control,
		name: "dataConfig",
	})
	const [openItem, setOpenItem] = useState<string | undefined>(undefined)

	const allowedFiles = files.filter((file) => file.shape.length === 3)

	useState(() => {
		if (fields.length === 1) {
			setOpenItem("plot-0")
		}
	})

	function addPlot() {
		append(defaultPlot)
		setOpenItem(`plot-${fields.length}`)
	}

	function removePlot(index: number) {
		remove(index)
	}

	function getDimensions(index: number) {
		const source = formData.getValues(`dataConfig.${index}.source`)
		const shape = files.find((f) => f.fileName === source)
		return shape?.shape || []
	}

	function getResultsIndexes(index: number) {
		const shape = getDimensions(index)
		if (shape.length < 3) return [1]
		const resultsLength = shape[shape.length - 1]
		return Array.from({ length: resultsLength }, (_, i) => i)
	}

	function setShape3XValue(index: number, value: string) {
		formData.setValue(`dataConfig.${index}.x`, value)
		formData.setValue(`dataConfig.${index}.y`, 0)
	}

	return (
		<>
			<div className='flex gap-4 mb-4'>
				<Controller
					name='layoutConfig.title'
					control={formData.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel className='block text-sm font-medium'>
								Graph Title
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
								Graph Height (px)
							</FieldLabel>
							<Input {...field} type='number' />
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
			</div>
			<Activity mode={fields.length > 0 ? "visible" : "hidden"}>
				<Accordion
					type='single'
					collapsible
					value={openItem}
					onValueChange={(value) => setOpenItem(value || undefined)}>
					{/* Plot Item */}
					{fields.map((field, index) => (
						<AccordionItem key={field.id} value={`plot-${index}`}>
							<AccordionTrigger>
								<p className='flex items-center gap-2'>
									<ChartSpline />
									<span className='font-bold text-md'>
										{formData.watch(`dataConfig.${index}.name`) ||
											`Trace ${index + 1}`}
									</span>
								</p>
							</AccordionTrigger>
							<AccordionContent>
								{/* Plot title */}
								<Controller
									name={`dataConfig.${index}.name`}
									control={formData.control}
									render={({ field, fieldState }) => (
										<Field className='mb-4' data-invalid={fieldState.invalid}>
											<div className='flex justify-between items-center'>
												<FieldLabel className='block text-sm font-medium'>
													Trace Name
												</FieldLabel>
												{fields.length > 1 && (
													<Badge
														variant='destructive'
														className='cursor-pointer'
														onClick={() => removePlot(index)}>
														<Trash />
														Remove Trace
													</Badge>
												)}
											</div>
											<Input {...field} type='text' className='bg-background' />
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>
								{/* Plot source */}
								<Controller
									name={`dataConfig.${index}.source`}
									control={formData.control}
									render={({ field, fieldState }) => (
										<Field className='mb-4' data-invalid={fieldState.invalid}>
											<div className='flex justify-between'>
												<FieldLabel className='block text-sm font-medium'>
													Source
												</FieldLabel>
												{/* Normalize results */}
												<Controller
													name={`dataConfig.${index}.normalizeMode`}
													control={formData.control}
													render={({ field }) => (
														<Field>
															<div className='flex items-center gap-2 justify-end'>
																<FieldLabel className='block text-sm font-medium'>
																	Normalize Results
																</FieldLabel>
																<Switch
																	checked={field.value}
																	onCheckedChange={field.onChange}
																/>
															</div>
														</Field>
													)}
												/>
											</div>
											<div className='flex items-center gap-2'>
												{files.length > 0 ? (
													<Select
														onValueChange={(value) => {
															field.onChange(value)
															formData.setValue(`dataConfig.${index}.y`, 0)
															setShape3XValue(index, value)
														}}
														value={field.value}>
														<SelectTrigger className='bg-background grow max-w-[530px] truncate'>
															<SelectValue placeholder='Select a source file' />
														</SelectTrigger>
														<SelectContent>
															{allowedFiles.map((file) => (
																<SelectItem
																	key={file.fileName}
																	value={file.fileName}>
																	<span className='max-w-[320px] sm:max-w-[530px] truncate'>
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
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>
								<Activity
									mode={
										formData.watch(`dataConfig.${index}.source`) !== ""
											? "visible"
											: "hidden"
									}>
									<div className='flex flex-col md:flex-row gap-2 mb-4'>
										<Controller
											name={`dataConfig.${index}.y`}
											control={formData.control}
											render={({ field, fieldState }) => (
												<Field
													className='flex-1'
													data-invalid={fieldState.invalid}>
													<FieldLabel className='block text-sm font-medium'>
														Y Data (Results)
													</FieldLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value.toString()}>
														<SelectTrigger className='w-full bg-background'>
															<SelectValue placeholder='Select Y data' />
														</SelectTrigger>
														{getResultsIndexes(index).length > 1 ? (
															<SelectContent>
																{getResultsIndexes(index).map((resultIndex) => (
																	<SelectItem
																		key={resultIndex}
																		value={resultIndex.toString()}>
																		{resultIndex === 0 ? "Accuracy" : "Loss"}
																	</SelectItem>
																))}
															</SelectContent>
														) : (
															<SelectContent>
																<SelectItem value='1'>Times</SelectItem>
															</SelectContent>
														)}
													</Select>
													{fieldState.invalid && (
														<FieldError errors={[fieldState.error]} />
													)}
												</Field>
											)}
										/>
										<Controller
											name={`dataConfig.${index}.aggregationMode`}
											control={formData.control}
											render={({ field, fieldState }) => (
												<Field
													className='flex-1'
													data-invalid={fieldState.invalid}>
													<FieldLabel className='text-sm font-medium w-full'>
														Sims Aggregation
													</FieldLabel>
													<Select
														value={field.value}
														onValueChange={field.onChange}>
														<SelectTrigger className='w-full bg-background'>
															<SelectValue defaultValue={field.value} />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value='average'>Average</SelectItem>
															<SelectItem value='sum'>Sum</SelectItem>
															<SelectItem value='min'>Min</SelectItem>
															<SelectItem value='max'>Max</SelectItem>
														</SelectContent>
													</Select>
												</Field>
											)}
										/>
										<Controller
											name={`dataConfig.${index}.showBand`}
											control={formData.control}
											render={({ field, fieldState }) => (
												<Field
													className='flex-1'
													data-invalid={fieldState.invalid}>
													<FieldLabel className='text-sm font-medium w-full'>
														Show Band
													</FieldLabel>
													<Select
														value={field.value}
														onValueChange={field.onChange}
														disabled={
															formData.watch(
																`dataConfig.${index}.aggregationMode`,
															) !== "average"
														}>
														<SelectTrigger className='w-full bg-background'>
															<SelectValue defaultValue={field.value} />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value='none'>None</SelectItem>
															<SelectItem value='stddev'>
																Standard Deviation
															</SelectItem>
															<SelectItem value='minmax'>Min/Max</SelectItem>
														</SelectContent>
													</Select>
												</Field>
											)}
										/>
									</div>

									<Separator className='my-8' />

									<Controller
										name={`dataConfig.${index}.mode`}
										control={formData.control}
										render={({ field, fieldState }) => (
											<Field className='mb-4' data-invalid={fieldState.invalid}>
												<FieldLabel className='block text-sm font-medium'>
													Trace Mode
												</FieldLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}>
													<SelectTrigger className='w-full bg-background'>
														<SelectValue placeholder='Select plot mode' />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value='lines'>Lines</SelectItem>
														<SelectItem value='markers'>Markers</SelectItem>
														<SelectItem value='lines+markers'>
															Lines + Markers
														</SelectItem>
													</SelectContent>
												</Select>
											</Field>
										)}
									/>
									<div className='flex flex-col lg:flex-row gap-2'>
										{/* Lines Config */}
										{formData
											.watch(`dataConfig.${index}.mode`)
											.match(/line/g) && (
											<div className='border border-border rounded-md p-4 mb-4 w-full'>
												<h4 className='font-medium mb-4'>Line Configuration</h4>
												<div className='flex gap-2 items-end'>
													<Controller
														name={`dataConfig.${index}.line.dash`}
														control={formData.control}
														render={({ field, fieldState }) => (
															<Field data-invalid={fieldState.invalid}>
																<FieldLabel className='block text-sm font-medium'>
																	Style
																</FieldLabel>
																<Select
																	onValueChange={field.onChange}
																	value={field.value}>
																	<SelectTrigger className='w-full bg-background'>
																		<SelectValue placeholder='Select line dash style' />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value='solid'>Solid</SelectItem>
																		<SelectItem value='dot'>Dot</SelectItem>
																		<SelectItem value='dash'>Dash</SelectItem>
																		<SelectItem value='longdash'>
																			Long Dash
																		</SelectItem>
																		<SelectItem value='dashdot'>
																			Dash Dot
																		</SelectItem>
																		<SelectItem value='longdashdot'>
																			Long Dash Dot
																		</SelectItem>
																	</SelectContent>
																</Select>
															</Field>
														)}
													/>
													<Controller
														name={`dataConfig.${index}.line.width`}
														control={formData.control}
														render={({ field, fieldState }) => (
															<Field data-invalid={fieldState.invalid}>
																<FieldLabel className='block text-sm font-medium'>
																	Width
																</FieldLabel>
																<Input
																	{...field}
																	type='number'
																	min={1}
																	max={10}
																	placeholder='Enter line width'
																	className='bg-background'
																/>
																{fieldState.invalid && (
																	<FieldError errors={[fieldState.error]} />
																)}
															</Field>
														)}
													/>
													<div className='flex-none'>
														<HexPicker
															index={index}
															formData={formData}
															dataItem='line'
														/>
													</div>
												</div>
											</div>
										)}

										{/* Markers Config */}
										{formData
											.watch(`dataConfig.${index}.mode`)
											.match(/marker/g) && (
											<div className='border border-border rounded-md p-4 mb-4 w-full'>
												<h4 className='font-medium mb-4'>
													Marker Configuration
												</h4>
												<div className='flex gap-2 items-end'>
													<Controller
														name={`dataConfig.${index}.marker.symbol`}
														control={formData.control}
														render={({ field, fieldState }) => (
															<Field data-invalid={fieldState.invalid}>
																<FieldLabel className='block text-sm font-medium'>
																	Symbol
																</FieldLabel>
																<Select
																	onValueChange={field.onChange}
																	value={field.value}>
																	<SelectTrigger className='w-full bg-background'>
																		<SelectValue placeholder='Select marker symbol' />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value='circle'>
																			Circle
																		</SelectItem>
																		<SelectItem value='circle-open'>
																			Circle Open
																		</SelectItem>
																		<SelectItem value='circle-dot'>
																			Circle Dot
																		</SelectItem>
																		<SelectItem value='circle-open-dot'>
																			Circle Open Dot
																		</SelectItem>
																		<SelectItem value='square'>
																			Square
																		</SelectItem>
																		<SelectItem value='square-open'>
																			Square Open
																		</SelectItem>
																		<SelectItem value='square-dot'>
																			Square Dot
																		</SelectItem>
																		<SelectItem value='square-open-dot'>
																			Square Open Dot
																		</SelectItem>
																		<SelectItem value='diamond'>
																			Diamond
																		</SelectItem>
																		<SelectItem value='diamond-open'>
																			Diamond Open
																		</SelectItem>
																		<SelectItem value='diamond-dot'>
																			Diamond Dot
																		</SelectItem>
																		<SelectItem value='diamond-open-dot'>
																			Diamond Open Dot
																		</SelectItem>
																		<SelectItem value='cross-open'>
																			Cross Open
																		</SelectItem>
																		<SelectItem value='cross-dot'>
																			Cross Dot
																		</SelectItem>
																		<SelectItem value='cross-open-dot'>
																			Cross Open Dot
																		</SelectItem>
																		<SelectItem value='x'>X</SelectItem>
																		<SelectItem value='x-open'>
																			X Open
																		</SelectItem>
																		<SelectItem value='x-dot'>X Dot</SelectItem>
																		<SelectItem value='x-open-dot'>
																			X Open Dot
																		</SelectItem>
																		<SelectItem value='triangle-up'>
																			Triangle Up
																		</SelectItem>
																		<SelectItem value='triangle-up-open'>
																			Triangle Up Open
																		</SelectItem>
																		<SelectItem value='triangle-up-dot'>
																			Triangle Up Dot
																		</SelectItem>
																		<SelectItem value='triangle-up-open-dot'>
																			Triangle Up Open Dot
																		</SelectItem>
																		<SelectItem value='pentagon'>
																			Pentagon
																		</SelectItem>
																		<SelectItem value='pentagon-open'>
																			Pentagon Open
																		</SelectItem>
																		<SelectItem value='pentagon-dot'>
																			Pentagon Dot
																		</SelectItem>
																		<SelectItem value='pentagon-open-dot'>
																			Pentagon Open Dot
																		</SelectItem>
																		<SelectItem value='star'>Star</SelectItem>
																		<SelectItem value='star-open'>
																			Star Open
																		</SelectItem>
																		<SelectItem value='star-dot'>
																			Star Dot
																		</SelectItem>
																		<SelectItem value='star-open-dot'>
																			Star Open Dot
																		</SelectItem>
																		<SelectItem value='asterisk'>
																			Asterisk
																		</SelectItem>
																		<SelectItem value='asterisk-open'>
																			Asterisk Open
																		</SelectItem>
																	</SelectContent>
																</Select>
															</Field>
														)}
													/>
													<Controller
														name={`dataConfig.${index}.marker.size`}
														control={formData.control}
														render={({ field, fieldState }) => (
															<Field data-invalid={fieldState.invalid}>
																<FieldLabel className='block text-sm font-medium'>
																	Size
																</FieldLabel>
																<Input
																	{...field}
																	type='number'
																	min={1}
																	placeholder='Enter marker size'
																	className='bg-background'
																/>
																{fieldState.invalid && (
																	<FieldError errors={[fieldState.error]} />
																)}
															</Field>
														)}
													/>
													<div className='flex-none'>
														<HexPicker
															index={index}
															formData={formData}
															dataItem='marker'
														/>
													</div>
												</div>
											</div>
										)}
									</div>
									{/* Hover Info and Template */}
									<div className='flex gap-2'>
										<Controller
											name={`dataConfig.${index}.hoverinfo`}
											control={formData.control}
											render={({ field, fieldState }) => (
												<Field
													className='mb-4'
													data-invalid={fieldState.invalid}>
													<FieldLabel className='block text-sm font-medium'>
														Mouse Over Info
													</FieldLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value}>
														<SelectTrigger className='w-full bg-background'>
															<SelectValue placeholder='Select hover info' />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value='all'>All</SelectItem>
															<SelectItem value='template'>
																Template Mode
															</SelectItem>
															<SelectItem value='x'>X</SelectItem>
															<SelectItem value='y'>Y</SelectItem>
															<SelectItem value='name'>Trace Name</SelectItem>
															<SelectItem value='x+y'>X + Y</SelectItem>
															<SelectItem value='x+name'>
																X + Trace Name
															</SelectItem>
															<SelectItem value='y+name'>
																Y + Trace Name
															</SelectItem>
															<SelectItem value='none'>None</SelectItem>
														</SelectContent>
													</Select>
												</Field>
											)}
										/>
										<Controller
											name={`dataConfig.${index}.hovertemplate`}
											control={formData.control}
											render={({ field }) => (
												<Field className='mb-4'>
													<FieldLabel className='block text-sm font-medium'>
														Template Mode
													</FieldLabel>
													<Input
														{...field}
														type='text'
														placeholder='Ex: Y Title %{y} | X Title %{x}'
														className='bg-background'
														disabled={
															formData.watch(
																`dataConfig.${index}.hoverinfo`,
															) !== "template"
																? true
																: false
														}
													/>
												</Field>
											)}
										/>
									</div>
								</Activity>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</Activity>
			<div className='text-center mt-8'>
				<Button size='sm' variant='outline' type='button' onClick={addPlot}>
					Add Trace
				</Button>
			</div>
		</>
	)
}
