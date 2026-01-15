"use client"

import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"
import { Controller, UseFormReturn } from "react-hook-form"

export default function LayoutTab({
	formData,
}: {
	formData: UseFormReturn<any>
}) {
	const [xAxisVisible, setXAxisVisible] = useState(
		formData.getValues("layoutConfig.xaxis.visible")
	)
	const [xAxisShowGrid, setXAxisShowGrid] = useState(
		formData.getValues("layoutConfig.xaxis.showgrid")
	)
	const [yAxisVisible, setYAxisVisible] = useState(
		formData.getValues("layoutConfig.yaxis.visible")
	)
	const [yAxisShowGrid, setYAxisShowGrid] = useState(
		formData.getValues("layoutConfig.yaxis.showgrid")
	)
	const [legendVisible, setLegendVisible] = useState(
		formData.getValues("layoutConfig.legend.visible")
	)

	return (
		<>
			<div className='flex flex-col lg:flex-row gap-4 mb-4'>
				{/* xaxis settings */}
				<div className='p-4 bg-muted-foreground/5 rounded-md'>
					<div className='flex justify-between items-center'>
						<Label className='font-bold text-md'>X-Axis</Label>
						<Controller
							name='layoutConfig.xaxis.visible'
							control={formData.control}
							render={({ field }) => (
								<div className='flex gap-2'>
									<Label>Visible</Label>
									<Switch
										checked={field.value}
										onCheckedChange={(checked) => {
											field.onChange(checked)
											setXAxisVisible(checked)
										}}
									/>
								</div>
							)}
						/>
					</div>
					<Controller
						name='layoutConfig.xaxis.title'
						control={formData.control}
						render={({ field, fieldState }) => (
							<Field className='mb-4 mt-6' data-invalid={fieldState.invalid}>
								<FieldLabel className='block text-sm font-medium'>
									Axis Title
								</FieldLabel>
								<Input
									{...field}
									type='text'
									disabled={!xAxisVisible}
									className='bg-background'
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<div className='flex gap-4 items-start'>
						<Controller
							name='layoutConfig.xaxis.side'
							control={formData.control}
							render={({ field, fieldState }) => (
								<Field className='mb-4 w-1/2' data-invalid={fieldState.invalid}>
									<FieldLabel className='block text-sm font-medium'>
										Position
									</FieldLabel>
									<Select
										defaultValue={field.value}
										onValueChange={field.onChange}
										disabled={!xAxisVisible}>
										<SelectTrigger className='w-full bg-background'>
											<SelectValue placeholder='Bottom' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='bottom'>Bottom</SelectItem>
											<SelectItem value='top'>Top</SelectItem>
										</SelectContent>
									</Select>
								</Field>
							)}
						/>
						<Controller
							name='layoutConfig.xaxis.griddash'
							control={formData.control}
							render={({ field, fieldState }) => (
								<Field className='mb-4 w-1/2' data-invalid={fieldState.invalid}>
									<Controller
										name='layoutConfig.xaxis.showgrid'
										control={formData.control}
										render={({ field: switchField }) => (
											<div className='flex gap-2'>
												<Label>Grid Line</Label>
												<Switch
													checked={switchField.value}
													onCheckedChange={(checked) => {
														switchField.onChange(checked)
														setXAxisShowGrid(checked)
													}}
												/>
											</div>
										)}
									/>
									<Select
										defaultValue={field.value}
										onValueChange={field.onChange}
										disabled={!xAxisVisible || !xAxisShowGrid}>
										<SelectTrigger className='w-full bg-background'>
											<SelectValue placeholder='Solid' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='solid'>Solid</SelectItem>
											<SelectItem value='dot'>Dot</SelectItem>
											<SelectItem value='dash'>Dash</SelectItem>
											<SelectItem value='longdash'>Long Dash</SelectItem>
											<SelectItem value='dashdot'>Dash Dot</SelectItem>
											<SelectItem value='longdashdot'>Long Dash Dot</SelectItem>
										</SelectContent>
									</Select>
								</Field>
							)}
						/>
					</div>
					<div className='flex gap-4 items-start'>
						<Controller
							name='layoutConfig.xaxis.tickangle'
							control={formData.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel className='block text-sm font-medium'>
										Tick Angle
									</FieldLabel>
									<Input
										{...field}
										type='number'
										min={-90}
										max={90}
										disabled={!xAxisVisible}
										className='bg-background'
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						<Controller
							name='layoutConfig.xaxis.tickprefix'
							control={formData.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel className='block text-sm font-medium'>
										Tick Prefix
									</FieldLabel>
									<Input
										{...field}
										type='text'
										disabled={!xAxisVisible}
										className='bg-background'
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						<Controller
							name='layoutConfig.xaxis.ticksuffix'
							control={formData.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel className='block text-sm font-medium'>
										Tick Suffix
									</FieldLabel>
									<Input
										{...field}
										type='text'
										disabled={!xAxisVisible}
										className='bg-background'
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
					</div>
				</div>

				{/* yaxis settings */}
				<div className='p-4 bg-muted-foreground/5 rounded-md'>
					<div className='flex justify-between items-center'>
						<Label className='font-bold text-md'>Y-Axis</Label>
						<Controller
							name='layoutConfig.yaxis.visible'
							control={formData.control}
							render={({ field }) => (
								<div className='flex gap-2'>
									<Label>Visible</Label>
									<Switch
										checked={field.value}
										onCheckedChange={(checked) => {
											field.onChange(checked)
											setYAxisVisible(checked)
										}}
									/>
								</div>
							)}
						/>
					</div>
					<Controller
						name='layoutConfig.yaxis.title'
						control={formData.control}
						render={({ field, fieldState }) => (
							<Field className='mb-4 mt-6' data-invalid={fieldState.invalid}>
								<FieldLabel className='block text-sm font-medium'>
									Axis Title
								</FieldLabel>
								<Input
									{...field}
									type='text'
									disabled={!yAxisVisible}
									className='bg-background'
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<div className='flex gap-4 items-start'>
						<Controller
							name='layoutConfig.yaxis.side'
							control={formData.control}
							render={({ field, fieldState }) => (
								<Field className='mb-4 w-1/2' data-invalid={fieldState.invalid}>
									<FieldLabel className='block text-sm font-medium'>
										Position
									</FieldLabel>
									<Select
										defaultValue={field.value}
										onValueChange={field.onChange}
										disabled={!yAxisVisible}>
										<SelectTrigger className='w-full bg-background'>
											<SelectValue placeholder='Left' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='left'>Left</SelectItem>
											<SelectItem value='right'>Right</SelectItem>
										</SelectContent>
									</Select>
								</Field>
							)}
						/>
						<Controller
							name='layoutConfig.yaxis.griddash'
							control={formData.control}
							render={({ field, fieldState }) => (
								<Field className='mb-4 w-1/2' data-invalid={fieldState.invalid}>
									<Controller
										name='layoutConfig.yaxis.showgrid'
										control={formData.control}
										render={({ field: switchField }) => (
											<div className='flex gap-2'>
												<Label>Grid Line</Label>
												<Switch
													checked={switchField.value}
													onCheckedChange={(checked) => {
														switchField.onChange(checked)
														setYAxisShowGrid(checked)
													}}
												/>
											</div>
										)}
									/>
									<Select
										defaultValue={field.value}
										onValueChange={field.onChange}
										disabled={!yAxisVisible || !yAxisShowGrid}>
										<SelectTrigger className='w-full bg-background'>
											<SelectValue placeholder='Solid' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='solid'>Solid</SelectItem>
											<SelectItem value='dot'>Dot</SelectItem>
											<SelectItem value='dash'>Dash</SelectItem>
											<SelectItem value='longdash'>Long Dash</SelectItem>
											<SelectItem value='dashdot'>Dash Dot</SelectItem>
											<SelectItem value='longdashdot'>Long Dash Dot</SelectItem>
										</SelectContent>
									</Select>
								</Field>
							)}
						/>
					</div>
					<div className='flex gap-4 items-start'>
						<Controller
							name='layoutConfig.yaxis.tickangle'
							control={formData.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel className='block text-sm font-medium'>
										Tick Angle
									</FieldLabel>
									<Input
										{...field}
										type='number'
										min={-90}
										max={90}
										disabled={!yAxisVisible}
										className='bg-background'
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						<Controller
							name='layoutConfig.yaxis.tickprefix'
							control={formData.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel className='block text-sm font-medium'>
										Tick Prefix
									</FieldLabel>
									<Input
										{...field}
										type='text'
										disabled={!yAxisVisible}
										className='bg-background'
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						<Controller
							name='layoutConfig.yaxis.ticksuffix'
							control={formData.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel className='block text-sm font-medium'>
										Tick Suffix
									</FieldLabel>
									<Input
										{...field}
										type='text'
										disabled={!yAxisVisible}
										className='bg-background'
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
					</div>
				</div>
			</div>

			{/* legend settings */}
			<div className='p-4 bg-muted-foreground/5 rounded-md mb-4'>
				<div className='flex justify-between items-center'>
					<Label className='font-bold text-md'>Legend</Label>
					<Controller
						name='layoutConfig.legend.visible'
						control={formData.control}
						render={({ field }) => (
							<div className='flex gap-2'>
								<Label>Visible</Label>
								<Switch
									checked={field.value}
									onCheckedChange={(checked) => {
										field.onChange(checked)
										setLegendVisible(checked)
									}}
								/>
							</div>
						)}
					/>
				</div>
				<div className='flex gap-4 mt-6 items-start'>
					<Controller
						name='layoutConfig.legend.orientation'
						control={formData.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel className='block text-sm font-medium'>
									Orientation
								</FieldLabel>
								<Select
									defaultValue={field.value}
									onValueChange={(value) => {
										field.onChange(value)
										if (value === "h") {
											formData.setValue("layoutConfig.legend.x", 0)
											formData.setValue("layoutConfig.legend.y", -0.1)
										} else {
											formData.setValue("layoutConfig.legend.x", 1.02)
											formData.setValue("layoutConfig.legend.y", 1)
										}
									}}
									disabled={!legendVisible}>
									<SelectTrigger className='w-full bg-background'>
										<SelectValue placeholder='Vertical' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='v'>Vertical</SelectItem>
										<SelectItem value='h'>Horizontal</SelectItem>
									</SelectContent>
								</Select>
							</Field>
						)}
					/>
					<Controller
						name='layoutConfig.legend.x'
						control={formData.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel className='block text-sm font-medium'>
									X Position
								</FieldLabel>
								<Input
									{...field}
									type='number'
									min={-2}
									max={3}
									step={0.01}
									disabled={!legendVisible}
									className='bg-background'
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						name='layoutConfig.legend.y'
						control={formData.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel className='block text-sm font-medium'>
									Y Position
								</FieldLabel>
								<Input
									{...field}
									type='number'
									min={-2}
									max={3}
									step={0.01}
									disabled={!legendVisible}
									className='bg-background'
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
				</div>
			</div>
		</>
	)
}
