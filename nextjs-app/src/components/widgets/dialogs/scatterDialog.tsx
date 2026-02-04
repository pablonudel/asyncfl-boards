"use client"
import {
	createScatterWidget,
	updateScatterConfig,
} from "@/actions/widgets/crudWidgets.actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DataTab from "@/components/widgets/dialogs/accloss-rounds/dataTab"
import LayoutTab from "@/components/widgets/dialogs/accloss-rounds/layoutTab"
import type { File } from "@/generated/prisma/client"
import {
	dataSchema,
	defaultPlot,
	FileNameMapping,
	layoutSchema,
} from "@/lib/schemas/scatterWidgetSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { JsonValue } from "@prisma/client/runtime/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

export default function ScatterDialog({
	userFiles,
	projectId,
	widgetConfig,
	widgetId,
	setIsDialogOpen,
	type,
	mode,
}: {
	userFiles: File[]
	projectId: string
	widgetConfig?: JsonValue
	widgetId?: string
	setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
	type: string
	mode: string
}) {
	const router = useRouter()
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

	const editDataConfig = () => {
		let dataConfig: any[] = []
		editConfig.dataConfig.forEach((plot: any) => {
			dataConfig.push({
				source: plot.source,
				aggregationMode: plot.aggregationMode,
				showBand: plot.showBand,
				normalizeMode: plot.normalizeMode,
				x: plot.x,
				y: plot.y,
				type: plot.type,
				mode: plot.mode,
				name: plot.name,
				line: {
					shape: plot.line.shape,
					dash: plot.line.dash,
					width: plot.line.width,
					color: plot.line.color,
				},
				marker: {
					color: plot.marker.color,
					size: plot.marker.size,
					symbol: plot.marker.symbol,
				},
				hoverinfo: plot.hoverinfo,
				hovertemplate: plot.hovertemplate,
			})
		})
		return dataConfig
	}

	useEffect(() => {
		if (userFiles.length > 0) {
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
		dataConfig: dataSchema,
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
								title:
									type === "rounds" ? "Rounds" : type === "time" ? "Time" : "",
								showgrid: true,
								griddash: "solid",
								side: "bottom",
								tickangle: 0,
								tickprefix: "",
								ticksuffix: "",
								visible: true,
							},
							yaxis: {
								title: "",
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
								orientation: "v",
								x: 1.02,
								y: 1,
							},
						},
			dataConfig:
				mode === "edit"
					? editDataConfig()
					: [
							{
								source: "",
								aggregationMode: "average",
								showBand: "none",
								normalizeMode: false,
								x: "",
								y: 0,
								type: "scatter",
								mode: "lines",
								name: "",
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
								hoverinfo: "all",
								hovertemplate: "",
							},
						],
		},
	})

	async function onSubmit(data: z.infer<typeof formSchema>) {
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
					type,
				)
			}
			if (!res.success) {
				toast.error(res.message)
				return
			}
			// router.refresh()
			setIsDialogOpen(false)
			toast.success(res.message)
		} catch (error) {
			console.error("Error submitting form:", error)
			toast.error("Failed to create widget")
		}
	}

	return (
		<>
			<Tabs defaultValue='Data'>
				<TabsList className='w-full'>
					<TabsTrigger value='Data'>Graph Config</TabsTrigger>
					<TabsTrigger value='Layout'>Advanced Layout Config</TabsTrigger>
				</TabsList>
				<form id='scatter-form' onSubmit={formData.handleSubmit(onSubmit)}>
					{/* Data Tab */}
					<TabsContent value='Data'>
						<DataTab
							formData={formData}
							defaultPlot={defaultPlot}
							files={files}
							userFiles={userFiles}
							projectId={projectId}
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
