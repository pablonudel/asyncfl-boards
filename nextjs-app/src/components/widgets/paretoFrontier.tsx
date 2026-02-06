"use client"

import { Widget } from "@/generated/prisma/client"
import { authClient } from "@/lib/auth-client"
import { readNpyFile } from "@/lib/readFiles"
import { FileX } from "lucide-react"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import { useEffect, useMemo, useRef, useState } from "react"

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

async function getDataFromSource(userId: string, source: string) {
	return await readNpyFile(userId!, source)
}

interface SimulationResult {
	simIndex: number
	finalAccuracy: number
	finalLoss: number
	totalTime: number
	roundTimes: number[]
	resolutionRatio?: number
	theta?: number
	energy?: number
	adjustedTime?: number
}

export const processRawData = (
	dataAccLoss: number[][][],
	dataTimes: number[][],
): SimulationResult[] => {
	return dataAccLoss.map((simAccData, idx) => {
		const simTimes = dataTimes[idx]
		const totalExecutionTime = simTimes.reduce((a, b) => a + b, 0)
		const lastRecordedMetrics = simAccData[simAccData.length - 1]

		// Normalizar accuracy a [0, 1]
		const rawAccuracy = lastRecordedMetrics[0]
		const finalAccuracy = rawAccuracy > 1 ? rawAccuracy / 100 : rawAccuracy

		return {
			simIndex: idx,
			finalAccuracy,
			finalLoss: lastRecordedMetrics[1],
			totalTime: totalExecutionTime,
			roundTimes: simTimes,
			resolutionRatio: simTimes.length / simAccData.length,
		}
	})
}

export function generateDerivedMetrics(
	sims: SimulationResult[],
	p: number,
	m: number,
) {
	return sims.map((sim) => {
		// Validación de entradas
		if (sim.totalTime <= 0 || p <= 0 || m <= 0) {
			return { ...sim, theta: 0, energy: 0, adjustedTime: sim.totalTime }
		}

		// Tiempo ajustado por capacidad de procesamiento
		// A menor p, más tiempo toma procesar las mismas tareas
		const adjustedTime = sim.totalTime / p

		// Modelo de carga de trabajo
		const workload = (m * p) / sim.totalTime

		// Modelo de potencia: P(w) = P_base + k * w^α
		const P_base = 5.0
		const k = 0.01
		const alpha = 1.5
		const avgPower = P_base + k * Math.pow(workload, alpha)

		// Energía total = Potencia promedio × Tiempo ajustado
		const energy = avgPower * adjustedTime

		// Theta como métrica de intensidad
		const theta = m / (p * sim.totalTime)

		return {
			...sim,
			theta: isFinite(theta) ? theta : 0,
			energy: isFinite(energy) ? energy : 0,
			adjustedTime: isFinite(adjustedTime) ? adjustedTime : sim.totalTime,
		}
	})
}

export function getParetoFrontier(
	points: { x: number; y: number; index: number }[],
) {
	const frontier = points.filter(
		(p1) =>
			!points.some(
				(p2) =>
					// p2 domina a p1 si:
					(p2.x < p1.x && p2.y >= p1.y) || // p2 tiene menos costo y igual/mejor accuracy
					(p2.x <= p1.x && p2.y > p1.y), // p2 tiene igual/menos costo y mejor accuracy
			),
	)
	return frontier.sort((a, b) => a.x - b.x)
}

export default function ParetoFrontier({
	widget,
	isFullColumn,
}: {
	widget: Widget
	isFullColumn: boolean
}) {
	const { theme } = useTheme()
	const [rawData, setRawData] = useState<{
		sourceAccLoss: any
		sourceTimes: any
	} | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [errorMsg, setErrorMsg] = useState<string | null>(null)
	const [plotKey, setPlotKey] = useState(0)
	const containerRef = useRef<HTMLDivElement | null>(null)

	// Estados para los sliders
	const [p, setP] = useState(0.5)
	const [m, setM] = useState(100)
	const [viewMode, setViewMode] = useState<"time" | "energy">("energy")

	const config =
		typeof widget.config === "object" && widget.config !== null
			? widget.config
			: {}

	const widgetDataConfig = (config as Record<string, any>).dataConfig || []
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

	// Cargar datos raw una sola vez
	useEffect(() => {
		async function loadData() {
			const { data: session } = await authClient.getSession()
			if (!session?.user) return
			setIsLoading(true)
			setErrorMsg(null)

			try {
				const plotConfig = widgetDataConfig[0]
				if (!plotConfig?.source) {
					throw new Error("No source configuration found")
				}

				const sourceAccLoss = await getDataFromSource(
					session.user.id,
					plotConfig.source.accloss,
				)
				const sourceTimes = await getDataFromSource(
					session.user.id,
					plotConfig.source.times,
				)

				setRawData({ sourceAccLoss, sourceTimes })
			} catch (error) {
				setErrorMsg("Error loading data from source")
			} finally {
				setIsLoading(false)
			}
		}

		loadData()
	}, [widget.id, configRevision])

	// Pre-procesamiento (se ejecuta solo cuando cambian los archivos raw)
	const baseSims = useMemo(() => {
		if (!rawData) return []
		return processRawData(
			rawData.sourceAccLoss.array as number[][][],
			rawData.sourceTimes.array as number[][],
		)
	}, [rawData])

	// Cálculo de métricas dinámicas (se ejecuta al mover sliders)
	const currentMetrics = useMemo(() => {
		if (baseSims.length === 0) return []
		return generateDerivedMetrics(baseSims, p, m)
	}, [baseSims, p, m])

	// Cálculo de Frontera de Pareto
	const paretoPoints = useMemo(() => {
		if (currentMetrics.length === 0) return []
		const points = currentMetrics.map((d) => ({
			x: viewMode === "energy" ? d.energy : d.adjustedTime || d.totalTime,
			y: d.finalAccuracy,
			index: d.simIndex,
		}))
		return getParetoFrontier(points)
	}, [currentMetrics, viewMode])

	// Data para el plot de Pareto
	const paretoPlotData = useMemo(() => {
		if (currentMetrics.length === 0) return []
		return [
			{
				x: currentMetrics.map((d) =>
					viewMode === "energy" ? d.energy : d.adjustedTime || d.totalTime,
				),
				y: currentMetrics.map((d) => d.finalAccuracy),
				mode: "markers",
				name: "Simulations",
				marker: { color: "#94a3b8", size: 6, opacity: 0.4 },
			},
			{
				x: paretoPoints.map((p) => p.x),
				y: paretoPoints.map((p) => p.y),
				mode: "lines+markers",
				name: "Pareto Frontier",
				line: { color: "#ef4444", shape: "hv" },
				marker: { color: "#ef4444", size: 8 },
			},
		]
	}, [currentMetrics, paretoPoints, viewMode])

	// Data para el plot de Energy-Theta
	const energyThetaPlotData = useMemo(() => {
		if (currentMetrics.length === 0) return []
		return [
			{
				x: currentMetrics.map((d) => d.theta),
				y: currentMetrics.map((d) => d.energy),
				mode: "markers",
				// type: "scatter",
				marker: {
					color: currentMetrics.map((d) => d.theta),
					colorscale: "Viridis",
					size: 8,
				},
				text: currentMetrics.map((d) => `Sim ID: ${d.simIndex}`),
				name: "Energy-Theta Map",
			},
		]
	}, [currentMetrics])

	// Actualizar plotKey cuando cambia isFullColumn o configRevision
	useEffect(() => {
		setPlotKey((prev) => prev + 1)
	}, [isFullColumn, configRevision])

	const layoutConfig = {
		title: {
			text: widgetLayoutConfig.title,
		},
		height: widgetLayoutConfig.height || 400,
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

	if (isLoading) return <div>Loading chart...</div>

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
		<div ref={containerRef} className='w-full h-full min-h-80 space-y-4'>
			{/* Sliders UI */}
			<div className='flex gap-4 p-4 border rounded-lg'>
				<div className='flex flex-col gap-2'>
					<label>Processing Power (p): {p.toFixed(2)}</label>
					<input
						type='range'
						min='0.1'
						max='1'
						step='0.01'
						value={p}
						onChange={(e) => setP(parseFloat(e.target.value))}
					/>
				</div>
				<div className='flex flex-col gap-2'>
					<label>Tasks (m): {m}</label>
					<input
						type='range'
						min='10'
						max='1000'
						step='10'
						value={m}
						onChange={(e) => setM(parseInt(e.target.value))}
					/>
				</div>
				<div className='flex flex-col gap-2'>
					<label>View Mode:</label>
					<select
						value={viewMode}
						onChange={(e) => setViewMode(e.target.value as "time" | "energy")}>
						<option value='energy'>Energy</option>
						<option value='time'>Time</option>
					</select>
				</div>
			</div>

			{/* Pareto Frontier Plot */}
			<div className='w-full'>
				<h3 className='text-lg font-semibold mb-2'>Pareto Frontier</h3>
				<Plot
					key={`pareto-${plotKey}`}
					className='w-full h-full'
					useResizeHandler
					style={{ width: "100%", height: "100%" }}
					data={paretoPlotData}
					layout={{
						...layoutConfig,
						title: {
							text:
								"Pareto Frontier: Accuracy vs " +
								(viewMode === "energy" ? "Energy" : "Time"),
						},
					}}
					config={{ displaylogo: false, responsive: true }}
				/>
			</div>

			{/* Energy-Theta Plot */}
			<div className='w-full'>
				<h3 className='text-lg font-semibold mb-2'>
					Energy-Theta Relationship
				</h3>
				<Plot
					key={`theta-${plotKey}`}
					className='w-full h-full'
					useResizeHandler
					style={{ width: "100%", height: "100%" }}
					data={energyThetaPlotData}
					layout={{
						...layoutConfig,
						title: { text: "Energy vs Theta (θ)" },
						xaxis: { ...layoutConfig.xaxis, title: { text: "Theta (θ)" } },
						yaxis: { ...layoutConfig.yaxis, title: { text: "Energy (J)" } },
					}}
					config={{ displaylogo: false, responsive: true }}
				/>
			</div>
		</div>
	)
}
