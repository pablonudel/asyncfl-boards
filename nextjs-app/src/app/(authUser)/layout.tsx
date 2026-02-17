import NavBar from "@/components/general/navBar"

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<div className='container mx-auto space-y-8 relative px-4 mb-16'>
			<div className='sticky top-4 left-4 right-4 mx-auto z-50'>
				<NavBar />
			</div>
			<div className='px-6'>{children}</div>
		</div>
	)
}
