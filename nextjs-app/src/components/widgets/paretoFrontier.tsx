"use client"

import { Widget } from "@/generated/prisma/client"
import { authClient } from "@/lib/auth-client"
import {
	buildFullRouting,
	calculateProportions,
	evaluateEnergy,
	evaluateMetrics,
} from "@/lib/paretoCalculs"
import { readJsonFile } from "@/lib/readFiles"
import { FileX, Info, RotateCcw, SlidersHorizontal, X } from "lucide-react"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Progress } from "../ui/progress"
import { Slider } from "../ui/slider"
import { Spinner } from "../ui/spinner"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

function getSliderValue(
	value: number | readonly number[],
	fallback: number,
): number {
	if (typeof value === "number") {
		return value
	}

	return value[0] ?? fallback
}

export default function ParetoFrontier({
	widget,
	userId,
	isPublic,
}: {
	widget: Widget
	userId?: string
	isPublic?: boolean
}) {
	const { theme } = useTheme()
	const [dataConfig, setDataConfig] = useState<any>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [errorMsg, setErrorMsg] = useState<string | null>(null)
	const [plotKey, setPlotKey] = useState(0)
	const containerRef = useRef<HTMLDivElement | null>(null)
	const [isFullColumn, setIsFullColumn] = useState(true)
	const [sidebarOpen, setSidebarOpen] = useState(false)

	const [optimalData, setOptimalData] = useState<any>(null)
	const [selectedRho, setSelectedRho] = useState<any>(null)
	const [concurrenceValue, setConcurrenceValue] = useState(29)
	const [mMinMax, setMMinMax] = useState({ min: 0, max: 0 })
	const [networkConfig, setNetworkConfig] = useState<any>(null)
	const [userWeights, setUserWeights] = useState<number[]>([])
	const [devicesCount, setDevicesCount] = useState<number[]>([])
	const [defaultParams, setDefaultParams] = useState<any>(null)
	const [baseDefaultParams, setBaseDefaultParams] = useState<any>(null)
	const [editableParams, setEditableParams] = useState<any>(null)
	const [initialConcurrenceValue, setInitialConcurrenceValue] = useState(0)

	const colorPalette = [
		[
			"bg-blue-700/50",
			"bg-cyan-500/50",
			"bg-teal-500/50",
			"bg-emerald-500/50",
			"bg-lime-500/50",
			"bg-yellow-400/50",
			"bg-amber-500/50",
			"bg-orange-500/50",
		],
		[
			"bg-blue-700",
			"bg-cyan-500",
			"bg-teal-500",
			"bg-emerald-500",
			"bg-lime-500",
			"bg-yellow-400",
			"bg-amber-500",
			"bg-orange-500",
		],
		[
			"border-blue-700",
			"border-cyan-500",
			"border-teal-500",
			"border-emerald-500",
			"border-lime-500",
			"border-yellow-400",
			"border-amber-500",
			"border-orange-500",
		],
	]

	const config =
		typeof widget.config === "object" && widget.config !== null
			? widget.config
			: {}

	// Serialize config once for stable dependency
	const configJSON = useMemo(
		() => JSON.stringify(widget.config),
		[widget.config],
	)

	// Calculates user routing proportions based on weights and device counts (MEMOIZED)
	const userRoutingProportions = useMemo(() => {
		if (!userWeights.length || !devicesCount.length) return []
		return calculateProportions(userWeights, devicesCount)
	}, [userWeights, devicesCount])

	// Builds the full routing vector for the queuing network based on user proportions and network configuration (MEMOIZED)
	const fullUserRouting = useMemo(() => {
		if (!userRoutingProportions.length || !networkConfig?.devices) return []
		return buildFullRouting(userRoutingProportions, networkConfig.devices)
	}, [userRoutingProportions, networkConfig])

	// Calculates user metrics (time, energy, throughput) based on the full routing and current parameters (MEMOIZED)
	const userMetrics = useMemo(() => {
		if (
			!fullUserRouting.length ||
			!networkConfig ||
			!defaultParams ||
			concurrenceValue === 0
		) {
			return null
		}

		try {
			const { tau, throughput } = evaluateMetrics(
				fullUserRouting,
				concurrenceValue,
				networkConfig,
				defaultParams,
			)
			const energy = evaluateEnergy(
				fullUserRouting,
				concurrenceValue,
				networkConfig,
				defaultParams,
			)

			return {
				tau,
				energy,
				throughput,
				m: concurrenceValue,
			}
		} catch (error) {
			console.error("Error calculating user metrics:", error)
			return null
		}
	}, [fullUserRouting, concurrenceValue, networkConfig, defaultParams])

	// Optimized handler for weight changes, updates the specific index in the userWeights array without affecting others
	const handleUpdateWeights = useCallback((index: number, newValue: number) => {
		setUserWeights((prev) => {
			const updated = [...prev]
			updated[index] = newValue
			return updated
		})
	}, [])

	// Optimized handler for FL parameter changes, updates the specific key in the defaultParams object without affecting others
	const handleUpdateParams = useCallback((key: string, newValue: number) => {
		setDefaultParams((prev: any) => ({
			...prev,
			[key]: newValue,
		}))
	}, [])

	const handleResetUserValues = useCallback(() => {
		if (!networkConfig?.devices?.length || !baseDefaultParams || !mMinMax.max) {
			return
		}

		setConcurrenceValue(initialConcurrenceValue)
		setUserWeights(new Array(networkConfig.devices.length).fill(1))
		setDefaultParams({ ...baseDefaultParams })
	}, [networkConfig, baseDefaultParams, initialConcurrenceValue, mMinMax.max])

	const optimalValidation = useMemo(() => {
		if (!selectedRho || !networkConfig || !baseDefaultParams) {
			return null
		}

		try {
			const computed = evaluateMetrics(
				selectedRho.routing,
				selectedRho.m,
				networkConfig,
				baseDefaultParams,
			)
			const energy = evaluateEnergy(
				selectedRho.routing,
				selectedRho.m,
				networkConfig,
				baseDefaultParams,
			)

			const relError = (computedValue: number, referenceValue: number) => {
				if (referenceValue === 0) return 0
				return Math.abs((computedValue - referenceValue) / referenceValue) * 100
			}

			const tauError = relError(computed.tau, selectedRho.tau)
			const energyError = relError(energy, selectedRho.energy)
			const throughputError = relError(
				computed.throughput,
				selectedRho.throughput,
			)

			return {
				tauError,
				energyError,
				throughputError,
				maxError: Math.max(tauError, energyError, throughputError),
			}
		} catch (error) {
			console.error("Error validating optimal point:", error)
			return null
		}
	}, [selectedRho, networkConfig, baseDefaultParams])

	// Direct access for component use
	const widgetDataConfig = (config as Record<string, any>).dataConfig || {}
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

	// Re-render plot when fullColumn changes to trigger resize and adjust to new layout
	useEffect(() => {
		setPlotKey((prev) => prev + 1)
	}, [fullColumn])

	async function getDataFromSource(userId: string, fileName: string) {
		return await readJsonFile(userId, fileName)
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

			try {
				const source = await getDataFromSource(UserID, widgetDataConfig.source)

				const finalPlotData = {
					...widgetDataConfig,
					hovertemplate: `Rho %{customdata[0]}<br>m: %{customdata[1]}<br>Energy: %{y:.2s}<br>Time: %{x:.2s}<extra></extra>`,
					x: source.optimal_frontier.map((item: any) => item.tau),
					y: source.optimal_frontier.map((item: any) => item.energy),
					customdata: source.optimal_frontier.map((item: any) => [
						item.rho,
						item.m,
					]),
				}

				const optimalData = source.optimal_frontier
				const selectedIndex = Math.floor(optimalData.length / 2)
				const selectedRho = optimalData[selectedIndex]
				const mMinMax = source.frontier_stats.m
				const networkConfig = source.network_config
				const numOfDevices = networkConfig.devices.length
				const defaultParams = source.fl_params_default
				const editableParams = source.editable_params

				// Calcular m inicial (promedio del rango)
				const initialM = Math.round((mMinMax.min + mMinMax.max) / 2)

				// Inicializar pesos en 1.0 (tratamiento equitativo)
				const userWeights: number[] = new Array(numOfDevices).fill(1)
				const devicesCount: number[] = Object.values(
					networkConfig.client_distribution,
				)

				setDataConfig([finalPlotData])
				setOptimalData(optimalData)
				setSelectedRho(selectedRho)
				setConcurrenceValue(initialM)
				setInitialConcurrenceValue(initialM)
				setMMinMax(mMinMax)
				setNetworkConfig(networkConfig)
				setUserWeights(userWeights)
				setDevicesCount(devicesCount)
				setDefaultParams(defaultParams)
				setBaseDefaultParams(defaultParams)
				setEditableParams(editableParams)
			} catch (error) {
				console.error(error)
				setErrorMsg("Error loading data from source")
			} finally {
				setIsLoading(false)
			}
		}

		loadData()
	}, [widget.id, configRevision])

	useEffect(() => {
		try {
			const parsed = JSON.parse(configJSON)
			const fullCol = Boolean(parsed.fullColumn ?? false)
			setIsFullColumn(fullCol)
		} catch {
			setIsFullColumn(false)
		}
	}, [widget.config])

	// Building the plot data with additional traces for optimal point and user point (MEMOIZED)
	const plotData = useMemo(() => {
		if (!dataConfig || !selectedRho || !userMetrics) return dataConfig

		const traces = [...dataConfig]

		// Trace 2: optimal point from data
		traces.push({
			x: [selectedRho.tau],
			y: [selectedRho.energy],
			mode: "markers",
			type: "scatter",
			name: `ρ: ${selectedRho.rho} optimal`,
			marker: {
				size: 12,
				color: "#ff8904",
				symbol: "circle",
			},
			hovertemplate: `<span style="color: #ffffff"><b>Optimal</b><br>ρ=${selectedRho.rho}<br>m: ${selectedRho.m}<br>Energy: ${selectedRho.energy.toFixed(0)}<br>Time: ${selectedRho.tau.toFixed(2)}</span><extra></extra>`,
		})

		// Trace 3: User's interactive point
		traces.push({
			x: [userMetrics.tau],
			y: [userMetrics.energy],
			mode: "markers",
			type: "scatter",
			name: "Interactive Point",
			marker: {
				size: 10,
				color: "#00c951",
				symbol: "diamond",
			},
			hovertemplate: `<b>User</b><br>m: ${userMetrics.m}<br>Energy: ${userMetrics.energy.toFixed(0)}<br>Time: ${userMetrics.tau.toFixed(2)}<extra></extra>`,
		})

		// Trace 4: Connection line between optimal and user point
		traces.push({
			x: [userMetrics.tau, selectedRho.tau],
			y: [userMetrics.energy, selectedRho.energy],
			mode: "lines",
			type: "scatter",
			showlegend: false,
			line: { color: "#00c951", width: 2, dash: "dot" },
			hoverinfo: "skip",
		})

		return traces
	}, [dataConfig, selectedRho, userMetrics, theme])

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
			zeroline: widgetLayoutConfig.xaxis?.zeroline,
			gridcolor: theme === "light" ? "#d4d4d4" : "#444444",
			visible: widgetLayoutConfig.xaxis?.visible,
		},
		yaxis: {
			title: { text: widgetLayoutConfig.yaxis?.title },
			showgrid: widgetLayoutConfig.yaxis?.showgrid,
			griddash: widgetLayoutConfig.yaxis?.griddash,
			side: widgetLayoutConfig.yaxis?.side,
			tickangle: widgetLayoutConfig.yaxis?.tickangle,
			tickprefix: widgetLayoutConfig.yaxis?.tickprefix,
			ticksuffix: widgetLayoutConfig.yaxis?.ticksuffix,
			zeroline: widgetLayoutConfig.yaxis?.zeroline,
			gridcolor: theme === "light" ? "#d4d4d4" : "#444444",
			visible: widgetLayoutConfig.yaxis?.visible,
		},
		margin: {
			l: 50,
			r: 50,
			b: 50,
			t: 50,
		},
		paper_bgcolor: "transparent",
		plot_bgcolor: "transparent",
		font: {
			color: theme === "light" ? "#0a0a0a" : "#ffffff",
		},
		legend: {
			x: widgetLayoutConfig.legend?.x,
			y: widgetLayoutConfig.legend?.y,
			visible: widgetLayoutConfig.legend?.visible,
			orientation: widgetLayoutConfig.legend?.orientation,
		},
		hovermode: "closest" as const,
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

	if (!dataConfig) {
		return (
			<div className='flex items-center justify-center w-full h-full'>
				<p className='text-muted-foreground'>No data available</p>
			</div>
		)
	}

	function handleSideBarToggle() {
		setSidebarOpen((prev) => !prev)
	}

	return (
		<div className='w-full p-8 min-h-80' ref={containerRef}>
			<div
				className={`bg-card border-l w-full max-w-120 min-w-[320px] absolute z-5 top-0 bottom-0 rounded-r-xl overflow-y-scroll shadow-lg ${sidebarOpen ? "right-0 opacity-100" : "-right-120 opacity-0"} transition-all duration-300`}>
				<div className='flex items-center justify-between sticky top-0 bg-card w-full max-w-120 min-w-[320px] p-4 rounded-t-xl border-b z-9'>
					<p className='font-bold'>
						Configuration{" "}
						<Badge
							variant='outline'
							onClick={() => handleResetUserValues()}
							className='cursor-pointer'>
							Reset <RotateCcw data-icon='inline-end' />
						</Badge>
					</p>
					<Button
						size='icon'
						variant='secondary'
						onClick={() => handleSideBarToggle()}
						className='rounded-full'>
						<X />
					</Button>
				</div>
				<div>
					{/* Optimal point picking section */}
					<div className='space-y-2 border-b px-4 py-8'>
						<p className='font-bold'>Reference • ρ</p>
						{optimalData.map((item: any, index: number) => {
							const isSelected = selectedRho && item.rho === selectedRho.rho
							return (
								<Badge
									key={index}
									variant={isSelected ? "default" : "outline"}
									onClick={() => setSelectedRho(item)}
									className='cursor-pointer'>
									{item.rho}
								</Badge>
							)
						})}
					</div>
					{/* Concurrence config section */}
					<div className='space-y-2 border-b px-4 py-8'>
						<p className='font-bold'>Concurrence · m</p>
						<div className='flex items-center justify-between gap-2 mb-4'>
							<p className='text-sm'>Concurrent Tasks</p>
							<Badge variant='default'>{concurrenceValue}</Badge>
						</div>
						<Slider
							value={[concurrenceValue]}
							max={mMinMax.max}
							min={mMinMax.min}
							step={1}
							onValueChange={(value) =>
								setConcurrenceValue(getSliderValue(value, mMinMax.min))
							}
							className='mb-1'
						/>
						<div className='flex items-center justify-between gap-2 text-xs text-muted-foreground'>
							<p>{mMinMax.min}</p>
							<p> Optimal {selectedRho.m}</p>
							<p>{mMinMax.max}</p>
						</div>
					</div>
					{/* Weights config section */}
					<div className='space-y-2 border-b px-4 py-8'>
						<p className='font-bold'>
							Routing · P <Badge variant='outline'>Relative Weights</Badge>
						</p>
						<div className='space-y-2'>
							{Object.entries(selectedRho.routing_by_type).map(
								([key, { total }]: any[], index: number) => (
									<div
										key={key}
										className={`flex flex-col space-y-1 not-last:border-b not-last:pb-4 not-first:pt-2`}>
										<div className='flex items-center justify-between mb-4'>
											<div className='flex items-center gap-2'>
												<p className='text-sm font-bold'>{key}</p>
												<span className='text-xs text-muted-foreground'>
													| Qty {networkConfig.client_distribution[key]}
												</span>
												<Tooltip>
													<TooltipTrigger>
														<Info size={14} />
													</TooltipTrigger>
													<TooltipContent side='right'>
														{networkConfig.devices.map(
															(device: any, index: number) =>
																device.name === key && (
																	<div key={index}>
																		<Table className='text-background text-xs'>
																			<TableHeader>
																				<TableRow>
																					<TableHead className='text-background text-md font-bold'>
																						{key}
																					</TableHead>
																					<TableHead className='text-background'>
																						Speed
																					</TableHead>
																					<TableHead className='text-background'>
																						Power
																					</TableHead>
																				</TableRow>
																			</TableHeader>
																			<TableBody>
																				<TableRow>
																					<TableCell>Computation</TableCell>
																					<TableCell className='text-right'>
																						{device.comp_speed}
																					</TableCell>
																					<TableCell className='text-right'>
																						{device.comp_power_watts}w
																					</TableCell>
																				</TableRow>
																				<TableRow>
																					<TableCell>Upload</TableCell>
																					<TableCell className='text-right'>
																						{device.upload_speed}
																					</TableCell>
																					<TableCell className='text-right'>
																						{device.upload_power_watts}w
																					</TableCell>
																				</TableRow>
																				<TableRow className='border-none'>
																					<TableCell>Download</TableCell>
																					<TableCell className='text-right'>
																						{device.download_speed}
																					</TableCell>
																					<TableCell className='text-right'>
																						{device.download_power_watts}w
																					</TableCell>
																				</TableRow>
																			</TableBody>
																		</Table>
																	</div>
																),
														)}
													</TooltipContent>
												</Tooltip>
											</div>
											<Badge
												variant='outline'
												className={`${colorPalette[2][index]} font-bold`}>
												{userWeights[index].toFixed(2)}
											</Badge>
										</div>
										<Slider
											value={[userWeights[index] ?? 1]}
											max={3}
											min={0.01}
											step={0.01}
											onValueChange={(value) =>
												handleUpdateWeights(index, getSliderValue(value, 1))
											}
										/>
										<div>
											<p className='text-xs'>
												Interactive{" "}
												{userRoutingProportions[index]?.toFixed(4) || 0}
											</p>
											<Progress
												value={(userRoutingProportions[index] || 0) * 100}
												data-slot='progress-indicator'
												indicatorColor={colorPalette[1][index]}
											/>
											<Progress
												value={total * 100}
												data-slot='progress-indicator'
												indicatorColor={colorPalette[0][index]}
											/>
											<p className='text-xs text-muted-foreground'>
												Optimal {total.toFixed(4)}
											</p>
										</div>
									</div>
								),
							)}
						</div>
					</div>
					<div className='space-y-2 border-b px-4 py-8'>
						<p className='font-bold'>FL Params</p>
						{Object.entries(editableParams).map(
							(
								[
									key,
									{ label, default: defaultValue, min, max, step, description },
								]: any,
								index: number,
							) => (
								<div
									key={index}
									className='mb-4 not-last:border-b not-last:pb-4'>
									<div className='flex items-center justify-between mb-1'>
										<p className='font-bold'>{label}</p>
										<Badge variant='default'>
											{defaultParams[key].toFixed(2)}
										</Badge>
									</div>
									<p className='text-xs text-muted-foreground mb-4'>
										{description}
									</p>
									<Slider
										value={[defaultParams[key] ?? defaultValue]}
										max={max}
										min={min}
										step={step}
										className='mb-1'
										onValueChange={(value) =>
											handleUpdateParams(
												key,
												getSliderValue(value, defaultValue),
											)
										}
									/>
									<div className='flex items-center justify-between text-xs text-muted-foreground'>
										<p>{min.toFixed(2)}</p>
										<p>def.: {defaultValue.toFixed(2)}</p>
										<p>{max.toFixed(2)}</p>
									</div>
								</div>
							),
						)}
					</div>
				</div>
			</div>
			<Plot
				key={plotKey}
				className='w-full h-full'
				useResizeHandler
				style={{ width: "100%", height: "100%" }}
				data={plotData}
				layout={layoutConfig}
				config={{
					displaylogo: false,
					responsive: true,
					modeBarButtonsToRemove: [
						"zoom2d",
						"lasso2d",
						"select2d",
						"pan2d",
						"zoomIn2d",
						"zoomOut2d",
						"autoScale2d",
					],
				}}
			/>
			{userMetrics && (
				<div className='space-y-4'>
					<div className='flex items-center gap-2 justify-between'>
						<p className='font-bold'>Interactive vs. Reference</p>
						<Button
							size='icon'
							variant='secondary'
							onClick={() => handleSideBarToggle()}
							className='rounded-full'>
							<SlidersHorizontal />
						</Button>
					</div>
					<div className='grid grid-cols-2 gap-4 md:grid-cols-4 w-full'>
						{[
							{
								label: "Time • τ",
								user: userMetrics.tau,
								opt: selectedRho.tau,
								format: (v: number) => v.toFixed(2),
							},
							{
								label: "Energy • E",
								user: userMetrics.energy,
								opt: selectedRho.energy,
								format: (v: number) => v.toFixed(0),
							},
							{
								label: "Throughput • λ",
								user: userMetrics.throughput,
								opt: selectedRho.throughput,
								format: (v: number) => v.toFixed(4),
								invert: true,
							},
							{
								label: "Concurrence • m",
								user: userMetrics.m,
								opt: selectedRho.m,
								format: (v: number) => v.toString(),
								noQuality: true,
							},
						].map(({ label, user, opt, format, invert, noQuality }) => {
							const delta = (((user - opt) / opt) * 100).toFixed(1)
							const worse =
								delta &&
								(invert ? parseFloat(delta) < 0 : parseFloat(delta) > 0)
							const better =
								delta &&
								(invert ? parseFloat(delta) > 0 : parseFloat(delta) < 0)

							return (
								<div
									key={label}
									className='space-y-1 bg-muted-foreground/5 p-2 rounded-sm'>
									<p className='text-xs font-bold'>{label}</p>
									<div>
										<p className='text-lg font-bold'>{format(user)}</p>
										<p className='text-xs text-muted-foreground'>
											opt: {format(opt)}
										</p>
									</div>
									{delta && (
										<Badge
											variant={
												noQuality
													? "outline"
													: worse
														? "destructive"
														: better
															? "default"
															: "outline"
											}
											className={`text-xs ${better && "bg-green-600"} ${noQuality && "bg-muted-foreground/10"}`}>
											{parseFloat(delta) > 0 ? "+" : ""}
											{delta}%
										</Badge>
									)}
								</div>
							)
						})}
					</div>
				</div>
			)}
		</div>
	)
}
