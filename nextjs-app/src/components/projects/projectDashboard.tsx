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
import { CircleX } from "lucide-react"
import Link from "next/link"
import AddWidgetDropdown from "./addWidgetDropdown"
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

	return (
		<>
			<div className='space-y-4'>
				<div className='flex justify-between items-center'>
					<div className='flex items-baseline gap-2'>
						<Link
							href={`/projects`}
							className=' text-muted-foreground font-light hover:text-foreground'>
							Projects
						</Link>
						<span className=' text-muted-foreground font-light'>/</span>
						<h1 className='text-2xl font-bold'>{project.name}</h1>
					</div>
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
