"use client"

import type { Widget } from "@/generated/prisma/client"
import useSWR from "swr"

export function useWidgets(projectId: string) {
	const { data, error, isLoading, mutate } = useSWR<{
		widgets: Widget[]
		widgetsOrder: string[]
	}>(`/api/projects/${projectId}/widgets`, {
		revalidateOnFocus: true, // Usuario vuelve a la pestaña
		revalidateOnReconnect: true, // Se reconecta internet
		refreshInterval: 1000 * 60 * 60, // Cada 1 hora
	})

	return {
		widgets: data?.widgets || [],
		widgetsOrder: data?.widgetsOrder || [],
		isLoading,
		isError: error,
		mutate, // Para revalidar manualmente
	}
}
