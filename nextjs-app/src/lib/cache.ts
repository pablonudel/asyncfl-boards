import { unstable_cache } from "next/cache"

/**
 * Wrapper sobre unstable_cache para datos de usuario/proyecto.
 * Facilita migración futura a cache APIs estables.
 *
 * @param fn - Función async a cachear
 * @param keys - Array de strings para identificar la entrada (ej: ["projects", userId])
 * @param options - Opciones de cache
 * @returns Función cacheada
 */
export const cacheUserData = <TArgs extends unknown[], TResult>(
	fn: (...args: TArgs) => Promise<TResult>,
	keys: string[],
	options: {
		/**
		 * Tags para invalidación granular con revalidateTag
		 * Ej: [`projects:${userId}`, `project:${projectId}`]
		 */
		tags: string[]
		/**
		 * Tiempo en segundos antes de revalidar automáticamente
		 * @default 3600 (1 hora)
		 */
		revalidate?: number
	}
) => {
	return unstable_cache(fn, keys, {
		revalidate: options.revalidate ?? 3600,
		tags: options.tags,
	})
}

/**
 * Wrapper para datos de proyectos por usuario
 */
export const cacheProjects = <TArgs extends unknown[], TResult>(
	fn: (...args: TArgs) => Promise<TResult>,
	userId: string,
	additionalKeys: string[] = [],
	additionalTags: string[] = []
) => {
	return cacheUserData(fn, ["projects", userId, ...additionalKeys], {
		tags: [`projects:${userId}`, ...additionalTags],
		revalidate: 3600,
	})
}

/**
 * Wrapper para datos de un proyecto específico
 */
export const cacheProject = <TArgs extends unknown[], TResult>(
	fn: (...args: TArgs) => Promise<TResult>,
	userId: string,
	projectId: string,
	additionalKeys: string[] = [],
	additionalTags: string[] = []
) => {
	return cacheUserData(fn, ["project", userId, projectId, ...additionalKeys], {
		tags: [`projects:${userId}`, `project:${projectId}`, ...additionalTags],
		revalidate: 3600,
	})
}
