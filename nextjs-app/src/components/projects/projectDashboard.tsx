import { getUserSession } from "@/actions/auth/auth.actions"
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty"
import { getUserFiles } from "@/data/filesData"
import { getUserProjectById, getWidgetsByProjectId } from "@/data/projectsData"
import { cn } from "@/lib/utils"
import { CircleX } from "lucide-react"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import AddWidgetDropdown from "./addWidgetDropdown"
import ProjectCardMenu from "./projectCardMenu"
import ProjectWidgets from "./projectWidgets"

export default async function ProjectDashboard({
	params,
}: {
	params: Promise<{ projectId: string }>
}) {
	const session = await getUserSession()
	if (!session || !session.user) return null
	const user = session.user

	const { projectId } = await params

	const resProjects = await getUserProjectById(projectId, user.id)
	const resWidgets = await getWidgetsByProjectId(projectId, user.id)
	const resFiles = await getUserFiles(user.id)

	if (!resProjects.success || !resProjects.project) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia>
						<CircleX size={48} />
					</EmptyMedia>
					<EmptyTitle>Error loading dashboard</EmptyTitle>
					<EmptyDescription className='mb-4'>
						An error occurred while fetching your dashboard. Please try again
						later.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		)
	}

	const project = resProjects.project
	const widgets = resWidgets.success ? (resWidgets.widgets ?? []) : []

	const isNewProject =
		project.createdAt.getTime() === project.updatedAt.getTime()

	return (
		<>
			<div className='space-y-4'>
				<div className='space-y-4'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-4'>
							<Badge
								variant={project.isPublic ? "default" : "outline"}
								className={cn(
									project.isPublic && "bg-blue-600 text-white font-bold",
								)}>
								{project.isPublic ? "Public" : "Private"}
							</Badge>
							<p className='text-sm'>
								{isNewProject
									? `Created on ${project.createdAt.toLocaleDateString()}`
									: `Last update on ${project.updatedAt.toLocaleDateString()}`}
							</p>
						</div>
						<ProjectCardMenu project={project} />
					</div>
					<div className='space-y-1'>
						<h1 className='text-3xl font-bold'>{project.name}</h1>
						<p className='text-lg'>{project.description}</p>
					</div>
					<Separator className='mt-8' />
				</div>
				<div className='flex justify-between items-center'>
					<AddWidgetDropdown
						userFiles={resFiles.files || []}
						projectId={project.id}
					/>
				</div>
				<ProjectWidgets
					projectWidgets={widgets}
					widgetsOrder={project.widgetsOrder || []}
					projectId={project.id}
					userFiles={resFiles.files || []}
				/>
			</div>
		</>
	)
}
