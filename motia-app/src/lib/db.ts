import { Kysely, PostgresDialect } from "kysely"
import { Pool } from "pg"
import { DB } from "../../../nextjs-app/types/db" // Ruta a los tipos generados

const dialect = new PostgresDialect({
	pool: new Pool({
		connectionString: process.env.DATABASE_URL,
		max: 10, // Ajusta según el plan de tu DB
	}),
})

// El objeto 'db' tendrá autocompletado basado en tu esquema de Prisma
export const db = new Kysely<DB>({
	dialect,
})
