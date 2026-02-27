import { headers } from "next/headers"
import { auth } from "./auth"

/**
 * Fetches the current user's session from the server.
 * @returns The session object if successful, or null if an error occurs.
 * @throws Will log an error if the session cannot be retrieved.
 */
export async function GetSession() {
	"use server"
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		return session
	} catch (error) {
		console.error("Error getting session:", error)
		return null
	}
}
