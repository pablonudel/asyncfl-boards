import { z } from "zod"
import { plotDataSchema } from "./generalWidgetsSchemas"

// Plot dataConfig Schema
export const scatterSchema = plotDataSchema.extend({
	source: z.string().min(1, "Data source must be selected"),
	aggregationMode: z.enum(["sum", "average", "min", "max"]).default("average"),
	showBand: z.enum(["none", "stddev", "minmax"]).default("none"),
	normalizeMode: z.boolean().default(false),
})

export const paretoSchema = z.object({
	source: z.string().min(1, "Data source must be selected"),
	type: z.literal("pareto"),
	mode: z.string().default("lines+markers"),
	name: z.string().default("Optimal Frontier"),
	line: z.object({
		shape: z.string().default("spline"),
		dash: z.string().default("solid"),
		width: z.coerce.number().default(2),
		color: z.string().default("#3333CC"),
	}),
	marker: z.object({
		color: z.string().default("#3333CC"),
		size: z.coerce.number().default(6),
		symbol: z.string().default("circle"),
	}),
	hoverinfo: z.string().default("template"),
	hovertemplate: z.string().default("Time: %{x}<br>Energy: %{y}"),
})

// default plot data configuration
export const defaultScatterPlot: z.infer<typeof scatterSchema> = {
	source: "",
	aggregationMode: "average",
	showBand: "none",
	normalizeMode: false,
	x: "",
	y: 0,
	type: "scatter" as const,
	mode: "lines" as const,
	name: "",
	line: {
		shape: "spline" as const,
		dash: "solid" as const,
		width: 2,
		color: "#3333CC",
	},
	marker: {
		color: "#3333CC",
		size: 6,
		symbol: "circle" as const,
	},
	hoverinfo: "all" as const,
	hovertemplate: "",
}

// export function defaultParetoPlot(
// 	default_rho_index: number,
// 	epsilon: number,
// 	L: number,
// 	sigma: number,
// 	G: number,
// 	M: number,
// 	A: number,
// 	GPU: number,
// 	Mobile: number,
// 	Laptop: number,
// 	IoT: number,
// 	HPC: number,
// 	m: number,
// ) {
// 	return {
// 		source: "",
// 		x: "",
// 		y: 0,
// 		default_rho_index,
// 		epsilon,
// 		L,
// 		sigma,
// 		G,
// 		M,
// 		A,
// 		GPU,
// 		Mobile,
// 		Laptop,
// 		IoT,
// 		HPC,
// 		m,
// 		type: "scatter" as const,
// 		mode: "lines" as const,
// 		name: "",
// 		line: {
// 			shape: "spline" as const,
// 			dash: "solid" as const,
// 			width: 2,
// 			color: "#3333CC",
// 		},
// 		marker: {
// 			color: "#3333CC",
// 			size: 6,
// 			symbol: "circle" as const,
// 		},
// 		hoverinfo: "all" as const,
// 		hovertemplate: "",
// 	}
// }

export const scatterDataSchema = z
	.array(scatterSchema)
	.min(1, "At least one plot is required")
