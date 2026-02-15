import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function proxy(req: NextRequest) {
	const pathname = req.nextUrl.pathname
	const isProtectedRoute =
		pathname.startsWith("/profile") ||
		pathname.startsWith("/projects") ||
		pathname.startsWith("/files")

	const isProtectedApi = pathname.startsWith("/api/avatar")

	const session = await auth.api.getSession({
		headers: await headers(),
	})

	if (!session) {
		const url = new URL("/", req.url)
		if (isProtectedApi || isProtectedRoute) {
			return NextResponse.redirect(url)
		}
	}

	return NextResponse.next()
}

export const config = {
	// runtime: "nodejs",
	matcher: [
		"/profile/:path*",
		"/projects/:path*",
		"/files/:path*",
		"/api/avatar/:path*",
		// si querés sumar más, agregalos aquí
	],
}
