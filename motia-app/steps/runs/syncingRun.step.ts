import { EventConfig, Handlers } from "motia"

export const config: EventConfig = {
	name: "Syncing Run",
	type: "event",
	subscribes: ["Run Config Checked"],
	emits: ["Run Synced"],
}

export const handler: Handlers["Syncing Run"] = async (
	input: any,
	{ logger, emit }: any,
) => {
	// Definir rutas de target
	// Actualizar el estado del job a SYNCING
	// Guardar .tar.gz de sources files y datasets en storage
	// crear dir del run en target
	// copiar y extraer el .tar.gz en la carpeta del target
	// copiar requirements a la carpeta del target
	// crear params.json en la carpeta del target
	// crear sbatch.sh en la carpeta del target
	// Actualizar el estado del job a READY
}
