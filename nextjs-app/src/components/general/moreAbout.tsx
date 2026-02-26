"use client"

import { Button } from "../ui/button"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog"

export default function MoreAbout() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant='secondary' className='border'>
					More about AsyncFL-Boards
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>About AsyncFL-Boards</DialogTitle>
				</DialogHeader>
				<p>
					<span className='font-bold'>AsyncFL-Boards</span> is a web-based
					platform developed as part of a research initiative by the{" "}
					<span className='font-bold'>SARA team</span>, focusing on optimizing
					asynchronous simulations within Federated Learning frameworks.
				</p>
				<p>
					The application provides a robust environment for generating
					interactive, shareable dashboards designed to streamline the
					visualization and analysis of complex simulation data.
				</p>
			</DialogContent>
		</Dialog>
	)
}
