import { ApiRouteConfig, Handlers } from "motia"
import { z } from "zod"

const CreateJobInputSchema = z.object({
	userId: z.uuid(),
	userName: z.string().min(1),
	userPassword: z.string().min(8),
	name: z.string().min(1),
	description: z.string().optional(),
})

export const config: ApiRouteConfig = {
	name: "Create Job",
	type: "api",
	path: "/api/create-job",
	bodySchema: CreateJobInputSchema,
	method: "POST",
}

export const handler: Handlers["Create Job"] = async (
	req: any,
	{ logger }: any,
) => {
	const { userId, userName, userPassword, name, description } = req.body
	// si no existen, crear las carpetas en pfcalcul
	// crear el job en la base de datos
	// retornar el job creado
}
