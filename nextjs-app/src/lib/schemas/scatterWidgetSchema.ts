import { z } from "zod"

// Interface for mapping file names to reference names and shapes
export interface FileNameMapping {
	fileName: string
	referenceName: string
	shape: number[]
}

export interface AxisDefaults {
	xAxisShowGrid: boolean
	xAxisVisible: boolean
	yAxisShowGrid: boolean
	yAxisVisible: boolean
	legendVisible: boolean
}

// layout Schema
export const layoutSchema = z.object({
	title: z.string().max(100, "Title must be at most 100 characters").optional(),
	height: z.coerce.number().min(200).max(800).default(400),
	scattermode: z.enum(["group", "overlay"]).default("overlay"),
	xaxis: z.object({
		title: z.string().max(50).optional(),
		showgrid: z.boolean().default(true),
		griddash: z
			.enum(["solid", "dot", "dash", "longdash", "dashdot", "longdashdot"])
			.default("solid"),
		side: z.enum(["bottom", "top"]).default("bottom"),
		tickangle: z.coerce.number().min(-90).max(90).default(0),
		tickprefix: z.string().optional(),
		ticksuffix: z.string().optional(),
		visible: z.boolean().default(true),
	}),
	yaxis: z.object({
		title: z.string().max(50).optional(),
		showgrid: z.boolean().default(true),
		griddash: z
			.enum(["solid", "dot", "dash", "longdash", "dashdot", "longdashdot"])
			.default("solid"),
		side: z.enum(["left", "right"]).default("left"),
		tickangle: z.coerce.number().min(-90).max(90).default(0),
		tickprefix: z.string().optional(),
		ticksuffix: z.string().optional(),
		visible: z.boolean().default(true),
	}),
	legend: z.object({
		visible: z.boolean().default(true),
		orientation: z.enum(["v", "h"]).default("v"),
		x: z.coerce.number().min(-2).max(3),
		y: z.coerce.number().min(-2).max(3),
	}),
})

// Plot dataConfig Schema
export const plotDataSchema = z.object({
	source: z.string().min(1, "Data source must be selected"),
	aggregationMode: z.enum(["sum", "average", "min", "max"]).default("average"),
	normalizeMode: z.boolean().default(false),
	x: z.string().min(1, "X data source must be selected"),
	y: z.coerce.number().min(0, "Y data must be selected"),
	type: z.literal("scatter"),
	mode: z.enum(["lines", "markers", "lines+markers"]).default("lines"),
	name: z
		.string()
		.min(1, "Name is required")
		.max(50, "Name must be at most 50 characters"),
	line: z.object({
		shape: z
			.enum(["linear", "spline", "vhv", "hvh", "vh", "hv"])
			.default("linear"),
		dash: z
			.enum(["solid", "dot", "dash", "longdash", "dashdot", "longdashdot"])
			.default("solid"),
		width: z.coerce
			.number()
			.min(1, "Line width must be at least 1")
			.max(10, "Line width must be at most 10")
			.default(2),
		color: z.string().default("#3333CC"),
	}),
	marker: z.object({
		color: z.string().default("#3333CC"),
		size: z.coerce.number().min(1, "Marker size must be at least 1").default(6),
		symbol: z.enum([
			"circle",
			"circle-open",
			"circle-dot",
			"circle-open-dot",
			"square",
			"square-open",
			"square-dot",
			"square-open-dot",
			"diamond",
			"diamond-open",
			"diamond-dot",
			"diamond-open-dot",
			"cross-open",
			"cross-dot",
			"cross-open-dot",
			"x",
			"x-open",
			"x-dot",
			"x-open-dot",
			"triangle-up",
			"triangle-up-open",
			"triangle-up-dot",
			"triangle-up-open-dot",
			"pentagon",
			"pentagon-open",
			"pentagon-dot",
			"pentagon-open-dot",
			"star",
			"star-open",
			"star-dot",
			"star-open-dot",
			"asterisk",
			"asterisk-open",
		]),
	}),
	hoverinfo: z
		.enum([
			"all",
			"x",
			"y",
			"name",
			"x+y",
			"x+name",
			"y+name",
			"template",
			"none",
		])
		.default("all"),
	hovertemplate: z.string().optional(),
})

// default plot data configuration
export const defaultPlot: z.infer<typeof plotDataSchema> = {
	source: "",
	// selectedData: [],
	aggregationMode: "average",
	normalizeMode: false,
	x: "",
	y: 0,
	type: "scatter" as const,
	mode: "lines" as const,
	name: "",
	line: {
		shape: "linear" as const,
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

export const dataSchema = z
	.array(plotDataSchema)
	.min(1, "At least one plot is required")
