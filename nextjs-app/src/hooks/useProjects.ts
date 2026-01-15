"use client"

import type { Project } from "@/generated/prisma/client"
import useSWR from "swr"

export function useProjects() {
	const { data, error, isLoading, mutate } = useSWR<{ projects: Project[] }>(
		"/api/projects",
		{
			revalidateOnFocus: true, // Usuario vuelve a la pestaña
			revalidateOnReconnect: true, // Se reconecta internet
			refreshInterval: 1000 * 60 * 60, // Cada 1 hora
		}
	)

	return {
		projects: data?.projects || [],
		isLoading,
		isError: error,
		mutate, // Para revalidar manualmente
	}
}
