import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import Link from "next/link"
import ProjectCardMenu from "./projectCardMenu"

type project = {
	id: string
	name: string
	createdAt: Date
	updatedAt: Date
	description: string | null
}

export default function ProjectCard({ project }: { project: project }) {
	const createdAt = new Date(project.createdAt)
	const updatedAt = new Date(project.updatedAt)

	// Comparar timestamps (ms desde epoch)
	const isNewProject = createdAt.getTime() === updatedAt.getTime()

	return (
		<Card className='flex flex-col justify-between h-68 w-full hover:scale-[1.03] duration-300 transition-transform group'>
			<CardHeader>
				<CardTitle className='flex justify-between items-start overflow-hidden gap-2 py-1 pe-1 font-normal'>
					<div className='overflow-hidden space-y-1'>
						<h2 className='text-xl truncate font-bold'>{project.name}</h2>
						{isNewProject ? (
							<p className='text-xs'>
								Created on {createdAt.toLocaleDateString()}
							</p>
						) : (
							<p className='text-xs'>
								Last update on {updatedAt.toLocaleDateString()}
							</p>
						)}
					</div>
					{/* <Link href={`/projects/${project.id}/settings`}>
						<Button
							variant='ghost'
							size='sm'
							className='p-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-300 text-foreground/50'>
							<Settings />
						</Button>
					</Link> */}
					<ProjectCardMenu project={project} />
				</CardTitle>
			</CardHeader>
			<CardContent className='flex-1'>
				<p className='text-sm'>{project.description}</p>
			</CardContent>
			<CardFooter>
				<Link href={`/projects/${project.id}`} className='w-full'>
					<Button variant='default' size='sm' className='w-full'>
						View Dashboard
					</Button>
				</Link>
			</CardFooter>
		</Card>
	)
}
