"use client"

import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Widget } from "@/generated/prisma/client"
import { authClient } from "@/lib/auth-client"
import { readJsonFile } from "@/lib/readFiles"
import { FileX, Info } from "lucide-react"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import { useEffect, useMemo, useRef, useState } from "react"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "../ui/accordion"
import { Badge } from "../ui/badge"
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card"
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

	const [optimalData, setOptimalData] = useState<any>(null)
	const [selectedRho, setSelectedRho] = useState<any>(null)
	const [concurrenceValue, setConcurrenceValue] = useState(29)
	const [mMinMax, setMMinMax] = useState({ min: 0, max: 0 })
	const [networkConfig, setNetworkConfig] = useState<any>(null)
	const [userRouting, setUserRouting] = useState<number[]>([])
	const [userWeights, setUserWeights] = useState<number[]>([])
	const [devicesCount, setDevicesCount] = useState<number[]>([])
	const [defaultParams, setDefaultParams] = useState<any>(null)
	const [editableParams, setEditableParams] = useState<any>(null)

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

	function calculateProportions(weights: number[], counts: number[]): number[] {
		const totalWeighted = weights.reduce((sum, w, i) => sum + w * counts[i], 0)

		return weights.map((w, i) => (w * counts[i]) / totalWeighted)
	}

	const config =
		typeof widget.config === "object" && widget.config !== null
			? widget.config
			: {}

	// Serialize config once for stable dependency
	const configJSON = useMemo(
		() => JSON.stringify(widget.config),
		[widget.config],
	)

	const handleUpdateWeights = (index: number, newValue: number) => {
		const updatedUserWeights = [...userWeights]
		updatedUserWeights[index] = newValue
		setUserWeights(updatedUserWeights)
		const updatedWeights = calculateProportions(
			updatedUserWeights,
			devicesCount,
		)
		setUserRouting(updatedWeights)
	}

	const handleUpdateParams = (key: string, newValue: number) => {
		const updatedParams = { ...defaultParams, [key]: newValue }
		setDefaultParams(updatedParams)
	}

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

	// Re-renderizar plot cuando cambia el ancho (pero NO recargar datos)
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
				// const devices = networkConfig.devices
				// const numOfClients = networkConfig.num_clients
				// const numOfRhos = source.metadata.rho_values.length
				const numOfDevices = networkConfig.devices.length
				const defaultParams = source.fl_params_default
				const editableParams = source.editable_params

				const userWeights: number[] = new Array(numOfDevices).fill(1)
				const devicesCount: number[] = Object.values(
					networkConfig.client_distribution,
				)
				const calculatedProportions = calculateProportions(
					userWeights,
					devicesCount,
				)

				setDataConfig([finalPlotData])
				setOptimalData(optimalData)
				setSelectedRho(selectedRho)
				setMMinMax(mMinMax)
				setNetworkConfig(networkConfig)
				setUserWeights(userWeights)
				setDevicesCount(devicesCount)
				setUserRouting(calculatedProportions)
				setDefaultParams(defaultParams)
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
		<div ref={containerRef} className='w-full min-h-80'>
			{/* <div className='bg-background/50 w-full max-w-120 min-w-[320px] absolute z-5 top-0 right-0 bottom-0 rounded-lg p-4 overflow-y-scroll'>
				<div className='fixed'>configuración</div>
				<div className='h-270 mt-20'>configuración</div>
			</div> */}
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
						"lasso2d",
						"select2d",
						"pan2d",
						"zoomIn2d",
						"zoomOut2d",
						"autoScale2d",
					],
				}}
			/>
			<div className='p-8'>
				<Accordion type='single' collapsible>
					<AccordionItem value='config'>
						<AccordionTrigger className='font-bold'>
							Interactive Configuration
						</AccordionTrigger>
						<AccordionContent className='space-y-4'>
							<div className='flex gap-4'>
								<Card className='w-1/2 rounded-sm'>
									<CardHeader>
										<CardTitle>Optimal Reference</CardTitle>
									</CardHeader>
									<CardContent>
										{optimalData.map((item: any, index: number) => {
											const isSelected =
												selectedRho && item.rho === selectedRho.rho
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
										{selectedRho && (
											<div>
												<p>
													<span>E </span>
													{selectedRho.energy.toFixed(2)}
												</p>
												<p>
													<span>T </span>
													{selectedRho.tau.toFixed(2)}
												</p>
												<p>
													<span>M </span>
													{selectedRho.m}
												</p>
												<p>
													<span>λ </span>
													{selectedRho.throughput.toFixed(2)}
												</p>
											</div>
										)}
									</CardContent>
								</Card>
								<Card className='w-1/2 rounded-sm'>
									<CardHeader>
										<CardTitle>Concurrence · M</CardTitle>
									</CardHeader>
									<CardContent className='h-full'>
										<div className='flex items-center justify-between gap-2 mb-4'>
											<p>Concurrent Tasks</p>
											<Badge variant='default'>{concurrenceValue}</Badge>
										</div>
										<Slider
											value={concurrenceValue}
											max={mMinMax.max}
											min={mMinMax.min}
											step={1}
											onValueChange={(value) =>
												setConcurrenceValue(value as number)
											}
											className='mb-1'
										/>
										<div className='flex items-center justify-between gap-2 text-xs text-muted-foreground'>
											<p>{mMinMax.min}</p>
											<p>{mMinMax.max}</p>
										</div>
									</CardContent>
									<CardFooter>
										<span className='text-xs text-muted-foreground'>
											Optimal {selectedRho.m}
										</span>
									</CardFooter>
								</Card>
							</div>
							<div className='flex gap-4'>
								<Card className='w-1/2 rounded-sm'>
									<CardHeader>
										<CardTitle>
											Routing · P{" "}
											<Badge variant='outline'>Relative Weights</Badge>
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='space-y-2'>
											{Object.entries(selectedRho.routing_by_type).map(
												([key, { total }]: any[], index: number) => (
													<div
														key={key}
														className={`flex flex-col space-y-1 not-last:border-b not-last:pb-4 not-first:pt-2`}>
														<div className='flex items-center justify-between mb-4'>
															<div className='flex items-center gap-2'>
																<p className='font-bold'>{key}</p>
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
																									<TableCell>
																										Computation
																									</TableCell>
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
																									<TableCell>
																										Download
																									</TableCell>
																									<TableCell className='text-right'>
																										{device.download_speed}
																									</TableCell>
																									<TableCell className='text-right'>
																										{
																											device.download_power_watts
																										}
																										w
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
															defaultValue={[1]}
															max={3}
															min={0.01}
															step={0.01}
															onValueChange={(value) =>
																handleUpdateWeights(index, value as number)
															}
														/>
														<div>
															<p className='text-xs'>
																Interactive {userRouting[index].toFixed(4)}
															</p>
															<Progress
																value={userRouting[index] * 100}
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
									</CardContent>
								</Card>
								<Card className='w-1/2 rounded-sm'>
									<CardHeader>
										<CardTitle>FL Params</CardTitle>
									</CardHeader>
									<CardContent className='h-full'>
										{Object.entries(editableParams).map(
											(
												[
													key,
													{
														label,
														default: defaultValue,
														min,
														max,
														step,
														description,
													},
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
														defaultValue={[defaultValue]}
														max={max}
														min={min}
														step={step}
														className='mb-1'
														onValueChange={(value) =>
															handleUpdateParams(key, value as number)
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
									</CardContent>
								</Card>
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
		</div>
	)
}
