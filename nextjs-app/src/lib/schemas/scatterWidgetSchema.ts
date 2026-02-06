import { z } from "zod"
import { plotDataSchema } from "./generalWidgetsSchemas"

// Plot dataConfig Schema
export const scatterSchema = plotDataSchema.extend({
	source: z.string().min(1, "Data source must be selected"),
	aggregationMode: z.enum(["sum", "average", "min", "max"]).default("average"),
	showBand: z.enum(["none", "stddev", "minmax"]).default("none"),
	normalizeMode: z.boolean().default(false),
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

export const scatterDataSchema = z
	.array(scatterSchema)
	.min(1, "At least one plot is required")
