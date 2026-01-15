import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function proxy(req: NextRequest) {
	const pathname = req.nextUrl.pathname
	const isProtectedRoute =
		pathname.startsWith("/profile") || pathname.startsWith("/projects")

	const isProtectedApi =
		pathname.startsWith("/api/projects") || pathname.startsWith("/api/s3")

	const session = await auth.api.getSession({
		headers: await headers(),
	})
	if (!session) {
		if (isProtectedApi) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}
		const url = new URL("/", req.url)
		return NextResponse.redirect(url)
	}

	return NextResponse.next()
}

export const config = {
	// runtime: "nodejs",
	matcher: [
		"/profile/:path*",
		"/projects/:path*",
		"/api/projects/:path*",
		"/api/s3/:path*",
		// si querés sumar más, agregalos aquí
	],
}
