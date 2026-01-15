"use client"

import { Widget } from "@/generated/prisma/client"
import { authClient } from "@/lib/auth-client"
import { readNpyFile } from "@/lib/readFiles"
import { shapeYData } from "@/lib/utils"
import { FileX } from "lucide-react"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import { useEffect, useMemo, useRef, useState } from "react"

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

export default function ScatterWidget({
	widget,
	isFullColumn,
}: {
	widget: Widget
	isFullColumn: boolean
}) {
	const { theme } = useTheme()
	const [dataConfig, setDataConfig] = useState<any[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [errorMsg, setErrorMsg] = useState<string | null>(null)
	const [plotKey, setPlotKey] = useState(0)
	const containerRef = useRef<HTMLDivElement | null>(null)

	const config =
		typeof widget.config === "object" && widget.config !== null
			? widget.config
			: {}

	const widgetDataConfig = (config as Record<string, any>).dataConfig || {}
	const widgetLayoutConfig = (config as Record<string, any>).layoutConfig || {}

	const configRevision = useMemo(() => {
		try {
			return JSON.stringify({
				data: widgetDataConfig,
				layout: widgetLayoutConfig,
			})
		} catch {
			return String(widget.id)
		}
	}, [widgetDataConfig, widgetLayoutConfig, widget.id])

	// Force re-render when isFullColumn changes
	useEffect(() => {
		setPlotKey((prev) => prev + 1)
	}, [isFullColumn, configRevision])

	// Function to read data from source file
	async function getDataFromSource(userId: string, source: string) {
		const cacheBust = Date.now()
		return await readNpyFile(
			userId!,
			widget.projectId!,
			`${source}?cb=${cacheBust}`
		)
	}

	useEffect(() => {
		async function loadData() {
			const { data: session } = await authClient.getSession()
			if (!session?.user) return
			setIsLoading(true)
			setErrorMsg(null)

			const plotPromises = widgetDataConfig.map(async (plotConfig: any) => {
				try {
					const source = await getDataFromSource(
						session.user.id,
						plotConfig.source
					)
					const sourceData = source.array
					const sourceShape = source.shape
					const xData =
						sourceShape.length > 2
							? source.array[0].length
							: await getDataFromSource(session.user.id, plotConfig.x).then(
									(res) => res.array[0].length
								)

					return {
						x: Array.from({ length: xData }, (_, i) => i + 1),
						y: shapeYData(
							sourceShape,
							plotConfig.aggregationMode,
							sourceData,
							plotConfig.y,
							plotConfig.normalizeMode,
							xData
						),
						type: "scatter",
						mode: plotConfig.mode,
						name: plotConfig.name,
						line: {
							shape: plotConfig.line.shape,
							dash: plotConfig.line.dash,
							width: plotConfig.line.width,
							color: plotConfig.line.color,
						},
						marker: {
							symbol: plotConfig.marker.symbol,
							size: plotConfig.marker.size,
							color: plotConfig.marker.color,
						},
						hoverinfo: plotConfig.hoverinfo,
						hovertemplate: plotConfig.hovertemplate,
					}
				} catch (error) {
					setErrorMsg("Error loading data from source")
					setIsLoading(false)
				}
			})

			const resolvedData = await Promise.all(plotPromises)
			setDataConfig(resolvedData)
			setIsLoading(false)
		}

		loadData()
	}, [widget.id, configRevision])

	const layoutConfig = {
		title: {
			text: widgetLayoutConfig.title,
		},
		height: widgetLayoutConfig.height,
		scattermode: widgetLayoutConfig.scattermode,
		xaxis: {
			title: { text: widgetLayoutConfig.xaxis.title },
			showgrid: widgetLayoutConfig.xaxis.showgrid,
			griddash: widgetLayoutConfig.xaxis.griddash,
			side: widgetLayoutConfig.xaxis.side,
			tickangle: widgetLayoutConfig.xaxis.tickangle,
			tickprefix: widgetLayoutConfig.xaxis.tickprefix,
			ticksuffix: widgetLayoutConfig.xaxis.ticksuffix,
			visible: widgetLayoutConfig.xaxis.visible,
			gridcolor: theme === "light" ? "#d4d4d4" : "#444444",
		},
		yaxis: {
			title: { text: widgetLayoutConfig.yaxis.title },
			showgrid: widgetLayoutConfig.yaxis.showgrid,
			griddash: widgetLayoutConfig.yaxis.griddash,
			side: widgetLayoutConfig.yaxis.side,
			tickangle: widgetLayoutConfig.yaxis.tickangle,
			tickprefix: widgetLayoutConfig.yaxis.tickprefix,
			ticksuffix: widgetLayoutConfig.yaxis.ticksuffix,
			visible: widgetLayoutConfig.yaxis.visible,
			gridcolor: theme === "light" ? "#d4d4d4" : "#444444",
		},
		legend: {
			orientation: widgetLayoutConfig.legend.orientation,
			x: widgetLayoutConfig.legend.x,
			y: widgetLayoutConfig.legend.y,
			visible: widgetLayoutConfig.legend.visible,
			bgcolor: "transparent",
			bordercolor: "transparent",
		},
		uirevision: configRevision,
		paper_bgcolor: "transparent",
		plot_bgcolor: "transparent",
		font: { color: theme === "light" ? "#0a0a0a" : "#ffffff" },
	}

	if (isLoading) {
		return <div>Loading chart...</div>
	}

	if (errorMsg) {
		return (
			<div className='flex flex-col items-center gap-4'>
				<FileX className='text-destructive' />
				<p className='text-destructive text-center'>{errorMsg}</p>
				<p className='text-sm'>Please check the source file and try again.</p>
			</div>
		)
	}

	return (
		<div ref={containerRef} className='w-full h-full min-h-80'>
			<Plot
				key={plotKey}
				className='w-full h-full'
				useResizeHandler
				style={{ width: "100%", height: "100%" }}
				data={dataConfig}
				layout={layoutConfig}
				config={{ displaylogo: false, responsive: true }}
			/>
		</div>
	)
}
