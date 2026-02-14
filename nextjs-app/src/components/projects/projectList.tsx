import { getUserSession } from "@/actions/auth/auth.actions"
import { getUserProjects } from "@/data/projectsData"
import { Project } from "@/generated/prisma/client"
import { CircleX, FolderSearch } from "lucide-react"
import { Suspense } from "react"
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "../ui/empty"
import ProjectCard from "./projectCard"

export default async function ProjectList() {
	const session = await getUserSession()
	if (!session.user) return null
	const user = session.user

	const res = await getUserProjects(user.id)
	const projects: Project[] = res.success ? (res.projects ?? []) : []

	// order projects by createdAt date, most recent first
	projects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

	if (!projects)
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia>
						<CircleX size={48} />
					</EmptyMedia>
					<EmptyTitle>Error loading dashboards</EmptyTitle>
					<EmptyDescription className='mb-4'>
						An error occurred while fetching your dashboards. Please try again
						later.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		)

	if (!projects.length) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia>
						<FolderSearch size={48} />
					</EmptyMedia>
					<EmptyTitle>You haven&apos;t created any dashboards yet.</EmptyTitle>
					<EmptyDescription className='mb-4'>
						Get started by creating your first dashboard.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		)
	}

	return (
		<Suspense fallback={<div>Loading dashboards...</div>}>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{projects.map((project) => (
					<ProjectCard key={project.id} project={project} />
				))}
			</div>
		</Suspense>
	)
}
