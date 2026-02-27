"use server"
import { auth } from "@/lib/auth"
import { cacheLife } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

/**
 * Retrieves the current user's session. If no session is found, redirects to the home page.
 * @returns
 */
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

/**
 * Retrieves a list of all sessions for the current user.
 * @returns
 */
export async function getUserSessionsList() {
	const sessions = await auth.api.listSessions({
		headers: await headers(),
	})
	return sessions
}
