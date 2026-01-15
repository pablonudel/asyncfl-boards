"use client"

import {
	ColorArea,
	ColorField,
	ColorPicker,
	ColorSlider,
	ColorSwatch,
	ColorSwatchPicker,
	ColorSwatchPickerItem,
	ColorThumb,
	SliderTrack,
} from "@/components/ui/color"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react"
import { parseColor } from "react-aria-components"
import { Controller, UseFormReturn } from "react-hook-form"
import { Field, FieldLabel } from "../ui/field"

export default function HexPicker({
	index,
	formData,
	dataItem,
}: {
	index: number
	formData: UseFormReturn<any>
	dataItem: string
}) {
	const [color, setColor] = useState(
		parseColor(formData.getValues(`dataConfig.${index}.${dataItem}.color`))
	)
	const [inputValue, setInputValue] = useState(
		formData.getValues(`dataConfig.${index}.${dataItem}.color`)
	)

	const path = `dataConfig.${index}.${dataItem}.color`

	function handleColorChange(nextColor: ReturnType<typeof parseColor>) {
		setColor(nextColor)
		setInputValue(nextColor.toString("hex"))
		const hex = nextColor.toString("hex")
		formData.setValue(path, hex)
	}

	function updateFormColor(value: string) {
		let cleanedValue = value.trim().toUpperCase()

		if (cleanedValue.startsWith("#")) {
			cleanedValue = cleanedValue.slice(1)
		}

		cleanedValue = cleanedValue.replace(/[^0-9A-F]/g, "").slice(0, 6)

		// Siempre actualizar el estado local para que se vea mientras escribes
		const displayColor = "#" + cleanedValue
		setInputValue(displayColor)

		// Solo guardar en formData cuando esté completo
		if (cleanedValue.length === 6) {
			setColor(parseColor(displayColor))
			formData.setValue(path, displayColor)
		}
	}

	return (
		<Controller
			name={`dataConfig.${index}.line.color`}
			control={formData.control}
			render={({ field, fieldState }) => (
				<Field className='mb-4' data-invalid={fieldState.invalid}>
					<div className='flex items-center gap-2'>
						<FieldLabel
							className='block text-sm font-medium'
							aria-label='Hex Color'>
							{dataItem.charAt(0).toUpperCase() + dataItem.slice(1)} Color
						</FieldLabel>
						<ColorPicker value={color} onChange={handleColorChange}>
							<Popover modal={true}>
								<PopoverTrigger asChild>
									<ColorSwatch
										className='rounded-md border-2'
										aria-label={`${dataItem} color swatch`}
									/>
								</PopoverTrigger>
								<PopoverContent className='w-fit' align='center' side='top'>
									<div className='mb-4'>
										<ColorArea
											colorSpace='hsb'
											xChannel='saturation'
											yChannel='brightness'
											className='h-[164px] rounded-b-none border-0'>
											<ColorThumb className='z-50' />
										</ColorArea>
										<ColorSlider colorSpace='hsb' channel='hue'>
											<SliderTrack className='rounded-t-none border-0'>
												<ColorThumb className='top-1/2' />
											</SliderTrack>
										</ColorSlider>
									</div>
									<ColorField
										colorSpace='hsb'
										className='flex gap-2 w-[192px] mb-4'
										aria-label={`${dataItem} hex color input`}>
										<Label htmlFor={`hex-input-${index}-${dataItem}`}>
											Hex
										</Label>
										<Input
											id={`hex-input-${index}-${dataItem}`}
											type='text'
											value={inputValue}
											onChange={(e) => updateFormColor(e.target.value)}
										/>
									</ColorField>
									<ColorSwatchPicker className='w-[192px] flex gap-0'>
										<ColorSwatchPickerItem color='#CC00CC'>
											<ColorSwatch />
										</ColorSwatchPickerItem>
										<ColorSwatchPickerItem color='#3333CC'>
											<ColorSwatch />
										</ColorSwatchPickerItem>
										<ColorSwatchPickerItem color='#00CCCC'>
											<ColorSwatch />
										</ColorSwatchPickerItem>
										<ColorSwatchPickerItem color='#33B333'>
											<ColorSwatch />
										</ColorSwatchPickerItem>
										<ColorSwatchPickerItem color='#CCCC33'>
											<ColorSwatch />
										</ColorSwatchPickerItem>
										<ColorSwatchPickerItem color='#CC6600'>
											<ColorSwatch />
										</ColorSwatchPickerItem>
									</ColorSwatchPicker>
								</PopoverContent>
							</Popover>
						</ColorPicker>
					</div>
				</Field>
			)}
		/>
	)
}
