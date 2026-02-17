"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Project } from "@/generated/prisma/client"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useState } from "react"
import ProjectCardMenu from "./projectCardMenu"

export default function ProjectCard({ project }: { project: Project }) {
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	// Comparar timestamps (ms desde epoch)
	const isNewProject =
		project.createdAt.getTime() === project.updatedAt.getTime()

	return (
		<Card
			className={cn(
				"h-80 w-full hover:scale-103 duration-300 transition-transform group",
				isMenuOpen && "scale-103",
			)}>
			<CardHeader className='flex items-center justify-between w-full gap-2'>
				<div className='flex items-center gap-2'>
					<Badge
						variant={project.isPublic ? "default" : "outline"}
						className={cn(
							project.isPublic && "bg-blue-600 text-white font-bold",
						)}>
						{project.isPublic ? "Public" : "Private"}
					</Badge>
					<p className='text-xs font-normal'>
						{isNewProject
							? `Created on ${project.createdAt.toLocaleDateString()}`
							: `Last update on ${project.updatedAt.toLocaleDateString()}`}
					</p>
				</div>
				<div
					className={cn(
						"lg:opacity-0 group-hover:opacity-100 duration-300 transition-opacity",
						isMenuOpen && "lg:opacity-100",
					)}>
					<ProjectCardMenu project={project} onOpenChange={setIsMenuOpen} />
				</div>
			</CardHeader>
			<CardContent className='flex-1 space-y-4'>
				<h2 className='text-xl truncate font-bold'>{project.name}</h2>
				<div className='text-sm text-wrap h-24 overflow-hidden line-clamp-5'>
					{project.description}
				</div>
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
