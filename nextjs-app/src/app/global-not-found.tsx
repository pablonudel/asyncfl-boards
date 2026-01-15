import { ThemeProvider } from "@/components/theme-provider"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
	title: "404 - Page Not Found",
	description: "The page you are looking for does not exist.",
}

export default function GlobalNotFound() {
	return (
		<html lang='en' className={inter.className} suppressHydrationWarning>
			<body className='flex w-full h-screen justify-center items-center'>
				<ThemeProvider
					attribute='class'
					defaultTheme='system'
					enableSystem
					disableTransitionOnChange>
					<div className='text-center'>
						<h1>404 - Page Not Found</h1>
						<p>This page does not exist.</p>
					</div>
				</ThemeProvider>
			</body>
		</html>
	)
}
