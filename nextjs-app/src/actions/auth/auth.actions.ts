"use server"
import { auth } from "@/lib/auth"
import { cacheLife } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function getUserSession() {
	"use cache: private"
	cacheLife("hours")
	const session = await auth.api.getSession({
		headers: await headers(),
	})
	if (!session || !session.user) {
		redirect("/")
	}
	return session
}

export async function getUserSessionsList() {
	const sessions = await auth.api.listSessions({
		headers: await headers(),
	})
	return sessions
}
