import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function proxy(req: NextRequest) {
	const pathname = req.nextUrl.pathname
	const isProtectedRoute =
		pathname.startsWith("/profile") ||
		pathname.startsWith("/projects") ||
		pathname.startsWith("/files")
	// pathname.startsWith("/admin")

	const isAdminRoute = pathname.startsWith("/admin")

	const session = await auth.api.getSession({
		headers: await headers(),
	})

	if (!session) {
		const url = new URL("/", req.url)
		if (isProtectedRoute) {
			return NextResponse.redirect(url)
		}
	}

	if (session?.user?.role !== "admin") {
		const url = new URL("/", req.url)
		if (isAdminRoute) {
			return NextResponse.redirect(url)
		}
	}

	if (session?.user?.email === process.env.ADMIN_EMAIL) {
		const url = new URL("/admin", req.url)
		if (isProtectedRoute) {
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
		"/admin/:path*",
	],
}
