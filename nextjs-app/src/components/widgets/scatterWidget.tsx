"use client"

import { Widget } from "@/generated/prisma/client"
import { authClient } from "@/lib/auth-client"
import { readNpyFile } from "@/lib/readFiles"
import { shapeData } from "@/lib/utils"
import { FileX } from "lucide-react"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import { Spinner } from "../ui/spinner"

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

type MeanStd = { mean: number[]; std: number[] }
type MinMax = { min: number[]; max: number[] }

function meanStdPerRound(data: number[][][], metricIndex: 0 | 1): MeanStd {
	const sims = data.length
	const rounds = data[0]?.length ?? 0
	const mean = new Array(rounds).fill(0)
	const std = new Array(rounds).fill(0)

	for (let r = 0; r < rounds; r++) {
		let sum = 0
		for (let s = 0; s < sims; s++) {
			sum += data[s][r][metricIndex]
		}
		mean[r] = sum / sims
	}

	for (let r = 0; r < rounds; r++) {
		let acc = 0
		for (let s = 0; s < sims; s++) {
			const diff = data[s][r][metricIndex] - mean[r]
			acc += diff * diff
		}
		std[r] = Math.sqrt(acc / sims)
	}

	return { mean, std }
}

function getMinMaxPerRound(data: number[][][], metricIndex: 0 | 1): MinMax {
	const rounds = data[0]?.length ?? 0
	const min = new Array(rounds).fill(Infinity)
	const max = new Array(rounds).fill(-Infinity)

	for (let r = 0; r < rounds; r++) {
		for (let s = 0; s < data.length; s++) {
			const value = data[s][r][metricIndex]
			if (value < min[r]) min[r] = value
			if (value > max[r]) max[r] = value
		}
	}

	return { min, max }
}

function hexToRgba(hex: string, alpha = 0.2) {
	const cleaned = hex.replace("#", "")
	const isShort = cleaned.length === 3
	const full = isShort
		? cleaned
				.split("")
				.map((c) => c + c)
				.join("")
		: cleaned
	const r = parseInt(full.slice(0, 2), 16)
	const g = parseInt(full.slice(2, 4), 16)
	const b = parseInt(full.slice(4, 6), 16)
	return `rgba(${r},${g},${b},${alpha})`
}

function ScatterWidget({
	widget,
	userId,
	isPublic = false,
}: {
	widget: Widget
	userId?: string
	isPublic?: boolean
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

	// Serialize config once for stable dependency
	const configJSON = useMemo(
		() => JSON.stringify(widget.config),
		[widget.config],
	)

	// Direct access for component use
	const widgetDataConfig = (config as Record<string, any>).dataConfig || []
	const widgetLayoutConfig = (config as Record<string, any>).layoutConfig || {}

	// Stable configRevision for useEffect dependency (data load trigger)
	const configRevision = useMemo(() => {
		try {
			const parsed = JSON.parse(configJSON)
			const dataConfig = parsed.dataConfig || []
			const layoutConfig = parsed.layoutConfig || {}
			return `${JSON.stringify(dataConfig)}|${JSON.stringify(layoutConfig)}`
		} catch {
			return ""
		}
	}, [configJSON])

	// Stable fullColumn for useEffect dependency (plot resize trigger)
	const fullColumn = useMemo(() => {
		try {
			const parsed = JSON.parse(configJSON)
			return Boolean(parsed.fullColumn ?? false)
		} catch {
			return false
		}
	}, [configJSON])

	// Re-renderizar plot cuando cambia el ancho (pero NO recargar datos)
	useEffect(() => {
		setPlotKey((prev) => prev + 1)
	}, [fullColumn])

	async function getDataFromSource(userId: string, source: string) {
		return await readNpyFile(userId!, source)
	}

	useEffect(() => {
		async function loadData() {
			let UserID: string | undefined
			if (isPublic && userId) {
				UserID = userId
			} else if (!isPublic || !userId) {
				const { data: session } = await authClient.getSession()
				if (!session?.user) return
				UserID = session.user.id
			} else {
				setIsLoading(false)
				setErrorMsg("Could not load data, user not authenticated")
				return
			}
			setIsLoading(true)
			setErrorMsg(null)

			const plotPromises = widgetDataConfig.map(async (plotConfig: any) => {
				try {
					const source = await getDataFromSource(UserID, plotConfig.source)

					const sourceData = source.array as number[][][]
					const sourceShape = source.shape
					const rounds =
						sourceShape.length > 2
							? source.array[0].length
							: await getDataFromSource(UserID, plotConfig.x).then(
									(res) => res.array[0].length,
								)

					const metricIndex = (plotConfig.y ?? 0) as 0 | 1
					const aggregationMode = plotConfig.aggregationMode ?? "average"
					const showBand = plotConfig.showBand ?? "none"
					const color = plotConfig.line?.color ?? "#3b82f6"
					const bandFill = hexToRgba(color, 0.3)

					const x = Array.from({ length: rounds }, (_, i) => i + 1)

					// Calcular la línea principal según el modo de agregación
					const mainLine = shapeData(
						sourceShape,
						aggregationMode,
						sourceData,
						metricIndex,
						plotConfig.normalizeMode ?? false,
						rounds,
					)

					const traces: any[] = []

					// Agregar banda si aggregationMode es average
					if (aggregationMode === "average") {
						if (showBand === "stddev") {
							const { mean, std } = meanStdPerRound(sourceData, metricIndex)
							const upper = mean.map((m, i) => m + std[i])
							const lower = mean.map((m, i) => m - std[i])

							traces.push(
								{
									x,
									y: upper,
									type: "scatter",
									mode: "lines",
									shape: "spline",
									line: { color: "transparent", shape: "spline" },
									showlegend: false,
									name: `${plotConfig.name ?? "mean"} Std Dev`,
								},
								{
									x,
									y: lower,
									type: "scatter",
									mode: "lines",
									fill: "tonexty",
									fillcolor: bandFill,
									line: { color: "transparent", shape: "spline" },
									name: `${plotConfig.name ?? "mean"} Std Dev`,
								},
							)
						} else if (showBand === "minmax") {
							const { min, max } = getMinMaxPerRound(sourceData, metricIndex)

							traces.push(
								{
									x,
									y: max,
									type: "scatter",
									mode: "lines",
									showlegend: false,
									line: { color: "transparent", shape: "spline" },
									name: `${plotConfig.name ?? "mean"} Min/Max`,
								},
								{
									x,
									y: min,
									type: "scatter",
									mode: "lines",
									fill: "tonexty",
									fillcolor: bandFill,
									line: { color: "transparent", shape: "spline" },
									name: `${plotConfig.name ?? "mean"} Min/Max`,
								},
							)
						}
					}

					// Línea principal
					traces.push({
						x,
						y: mainLine,
						type: "scatter",
						mode: plotConfig.mode ?? "lines",
						name: plotConfig.name ?? "mean",
						line: {
							shape: plotConfig.line?.shape ?? "spline",
							dash: plotConfig.line?.dash ?? "solid",
							width: plotConfig.line?.width ?? 2,
							color,
						},
						marker: {
							color: plotConfig.marker?.color ?? color,
							size: plotConfig.marker?.size ?? 6,
							symbol: plotConfig.marker?.symbol ?? "circle",
						},
						hoverinfo: plotConfig.hoverinfo ?? "all",
						hovertemplate: plotConfig.hovertemplate,
					})

					return traces
				} catch {
					setErrorMsg("Error loading data from source")
					setIsLoading(false)
					return []
				}
			})

			const resolvedData = (await Promise.all(plotPromises)).flat()
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
			title: { text: widgetLayoutConfig.xaxis?.title },
			showgrid: widgetLayoutConfig.xaxis?.showgrid,
			griddash: widgetLayoutConfig.xaxis?.griddash,
			side: widgetLayoutConfig.xaxis?.side,
			tickangle: widgetLayoutConfig.xaxis?.tickangle,
			tickprefix: widgetLayoutConfig.xaxis?.tickprefix,
			ticksuffix: widgetLayoutConfig.xaxis?.ticksuffix,
			visible: widgetLayoutConfig.xaxis?.visible,
			gridcolor: theme === "light" ? "#d4d4d4" : "#444444",
		},
		yaxis: {
			title: { text: widgetLayoutConfig.yaxis?.title },
			showgrid: widgetLayoutConfig.yaxis?.showgrid,
			griddash: widgetLayoutConfig.yaxis?.griddash,
			side: widgetLayoutConfig.yaxis?.side,
			tickangle: widgetLayoutConfig.yaxis?.tickangle,
			tickprefix: widgetLayoutConfig.yaxis?.tickprefix,
			ticksuffix: widgetLayoutConfig.yaxis?.ticksuffix,
			visible: widgetLayoutConfig.yaxis?.visible,
			gridcolor: theme === "light" ? "#d4d4d4" : "#444444",
		},
		margin: {
			l: 50,
			r: 50,
			b: 50,
			t: 50,
		},
		legend: {
			orientation: widgetLayoutConfig.legend?.orientation,
			x: widgetLayoutConfig.legend?.x,
			y: widgetLayoutConfig.legend?.y,
			visible: widgetLayoutConfig.legend?.visible,
			bgcolor: "transparent",
			bordercolor: "transparent",
		},
		uirevision: configRevision,
		paper_bgcolor: "transparent",
		plot_bgcolor: "transparent",
		font: { color: theme === "light" ? "#0a0a0a" : "#ffffff" },
	}

	if (isLoading) {
		return (
			<div className='flex items-center justify-center w-full h-full p-8'>
				<div className='text-center'>
					<Spinner className='size-8' />
				</div>
			</div>
		)
	}

	if (errorMsg) {
		return (
			<div className='flex flex-col items-center gap-4 p-8'>
				<FileX className='text-destructive' />
				<div>
					<p className='text-destructive text-center'>{errorMsg}</p>
					<p className='text-sm'>Please check the source file and try again.</p>
				</div>
			</div>
		)
	}

	return (
		<div ref={containerRef} className='w-full h-full min-h-80 p-8'>
			<Plot
				key={plotKey}
				className='w-full h-full'
				useResizeHandler
				style={{ width: "100%", height: "100%" }}
				data={dataConfig}
				layout={layoutConfig}
				config={{
					displaylogo: false,
					responsive: true,
					modeBarButtonsToRemove: [
						"zoom2d",
						"pan2d",
						"zoomIn2d",
						"zoomOut2d",
						"autoScale2d",
					],
				}}
			/>
		</div>
	)
}

// Memoize to prevent re-render when only parent changes, not actual config
export default memo(ScatterWidget, (prevProps, nextProps) => {
	if (prevProps.widget.id !== nextProps.widget.id) return false
	const prevConfig = JSON.stringify(prevProps.widget.config)
	const nextConfig = JSON.stringify(nextProps.widget.config)
	return prevConfig === nextConfig
})
