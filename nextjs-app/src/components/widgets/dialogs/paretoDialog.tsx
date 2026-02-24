"use client"
import {
	createScatterWidget,
	updateScatterConfig,
} from "@/actions/widgets/crudWidgets.actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { File } from "@/generated/prisma/client"
import {
	FileNameMapping,
	layoutSchema,
} from "@/lib/schemas/generalWidgetsSchemas"
import { paretoSchema } from "@/lib/schemas/scatterWidgetSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { JsonValue } from "@prisma/client/runtime/client"
import { useEffect, useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import LayoutTab from "./accloss-rounds/layoutTab"
import DataTab from "./pareto/dataTab"

export default function ParetoDialog({
	userFiles,
	projectId,
	userId,
	widgetConfig,
	widgetId,
	setIsDialogOpen,
	mode,
	onStatusChange,
}: {
	userFiles?: File[]
	projectId: string
	userId: string
	widgetConfig?: JsonValue
	widgetId?: string
	setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
	mode: string
	onStatusChange: (isSubmitting: boolean) => void
}) {
	const [files, setFiles] = useState<FileNameMapping[]>([])
	const editConfig = JSON.parse(JSON.stringify(widgetConfig || "{}"))

	const editLayoutConfig = {
		title: editConfig.layoutConfig?.title,
		height: editConfig.layoutConfig?.height,
		scattermode: editConfig.layoutConfig?.scattermode,
		xaxis: {
			title: editConfig.layoutConfig?.xaxis?.title,
			showgrid: editConfig.layoutConfig?.xaxis?.showgrid,
			griddash: editConfig.layoutConfig?.xaxis?.griddash,
			side: editConfig.layoutConfig?.xaxis?.side,
			tickangle: editConfig.layoutConfig?.xaxis?.tickangle,
			tickprefix: editConfig.layoutConfig?.xaxis?.tickprefix,
			ticksuffix: editConfig.layoutConfig?.xaxis?.ticksuffix,
			visible: editConfig.layoutConfig?.xaxis?.visible,
		},
		yaxis: {
			title: editConfig.layoutConfig?.yaxis?.title,
			showgrid: editConfig.layoutConfig?.yaxis?.showgrid,
			griddash: editConfig.layoutConfig?.yaxis?.griddash,
			side: editConfig.layoutConfig?.yaxis?.side,
			tickangle: editConfig.layoutConfig?.yaxis?.tickangle,
			tickprefix: editConfig.layoutConfig?.yaxis?.tickprefix,
			ticksuffix: editConfig.layoutConfig?.yaxis?.ticksuffix,
			visible: editConfig.layoutConfig?.yaxis?.visible,
		},
		legend: {
			visible: editConfig.layoutConfig?.legend?.visible,
			orientation: editConfig.layoutConfig?.legend?.orientation,
			x: editConfig.layoutConfig?.legend?.x,
			y: editConfig.layoutConfig?.legend?.y,
		},
	}

	const editDataConfig = {
		source: editConfig.dataConfig?.source,
		type: editConfig.dataConfig?.type,
		mode: editConfig.dataConfig?.mode,
		name: editConfig.dataConfig?.name,
		line: {
			shape: editConfig.dataConfig?.line?.shape || "spline",
			dash: editConfig.dataConfig?.line?.dash || "solid",
			width: editConfig.dataConfig?.line?.width || 2,
			color: editConfig.dataConfig?.line?.color || "#3333CC",
		},
		marker: {
			color: editConfig.dataConfig?.marker?.color || "#3333CC",
			size: editConfig.dataConfig?.marker?.size || 6,
			symbol: editConfig.dataConfig?.marker?.symbol || "circle",
		},
		hoverinfo: editConfig.dataConfig?.hoverinfo || "template",
	}

	useEffect(() => {
		if (userFiles && userFiles.length > 0) {
			const names = userFiles.map((file) => ({
				fileName: file.fileName,
				referenceName: file.referenceName,
				shape: file.fileShape,
			}))
			setFiles(names)
		}
	}, [userFiles])

	const formSchema = z.object({
		layoutConfig: layoutSchema,
		dataConfig: paretoSchema,
	})

	const formData = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema) as Resolver<z.infer<typeof formSchema>>,
		defaultValues: {
			layoutConfig:
				mode === "edit"
					? editLayoutConfig
					: {
							title: "",
							height: 400,
							scattermode: "overlay",
							xaxis: {
								title: "Time τ",
								showgrid: true,
								griddash: "solid",
								side: "bottom",
								tickangle: 0,
								tickprefix: "",
								ticksuffix: "",
								visible: true,
							},
							yaxis: {
								title: "Energy E",
								showgrid: true,
								griddash: "solid",
								side: "left",
								tickangle: 0,
								tickprefix: "",
								ticksuffix: "",
								visible: true,
							},
							legend: {
								visible: true,
								orientation: "h",
								x: 0,
								y: -0.2,
							},
						},
			dataConfig:
				mode === "edit"
					? editDataConfig
					: {
							source: "",
							type: "pareto",
							mode: "lines+markers",
							name: "Optimal Frontier",
							line: {
								shape: "spline",
								dash: "solid",
								width: 2,
								color: "#3333CC",
							},
							marker: {
								color: "#3333CC",
								size: 6,
								symbol: "circle",
							},
							hoverinfo: "template",
							// hovertemplate: "Time: %{x}<br>Energy: %{y}",
						},
		},
	})

	async function onSubmit(data: z.infer<typeof formSchema>) {
		onStatusChange(true)
		try {
			let res
			if (mode === "edit" && widgetId) {
				res = await updateScatterConfig(
					widgetId,
					data.dataConfig,
					data.layoutConfig,
				)
			} else {
				res = await createScatterWidget(
					projectId,
					data.dataConfig,
					data.layoutConfig,
					"pareto",
				)
			}
			if (!res.success) {
				toast.error(res.message)
				return
			}
			setIsDialogOpen(false)
			toast.success(res.message)
		} catch (error) {
			console.error("Error submitting form:", error)
			toast.error("Failed to create widget")
		} finally {
			onStatusChange(false)
		}
	}

	return (
		<>
			<Tabs defaultValue='Data'>
				<TabsList className='w-full'>
					<TabsTrigger value='Data'>Graph Config</TabsTrigger>
					<TabsTrigger value='Layout'>Advanced Layout Config</TabsTrigger>
				</TabsList>
				<form id='pareto-form' onSubmit={formData.handleSubmit(onSubmit)}>
					{/* Data Tab */}
					<TabsContent value='Data'>
						<DataTab
							formData={formData}
							files={files}
							projectId={projectId}
							userId={userId}
						/>
					</TabsContent>
					{/* Layout Tab */}
					<TabsContent value='Layout'>
						<LayoutTab formData={formData} />
					</TabsContent>
				</form>
			</Tabs>
		</>
	)
}
