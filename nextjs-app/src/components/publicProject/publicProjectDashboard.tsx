import {
	getProjectByIdPublic,
	getWidgetsByProjectId,
} from "@/data/projectsData"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import NavBar from "../general/navBar"
import ProjectWidgets from "../projects/projectWidgets"
import { Avatar, AvatarImage } from "../ui/avatar"

export default async function PublicProjectDashboard({
	params,
}: {
	params: Promise<{ idPublic: string }>
}) {
	const { idPublic } = await params

	const resProject = await getProjectByIdPublic(idPublic)
	if (!resProject.success || !resProject.project) {
		return notFound()
	}

	const projectUser = await prisma.user.findUnique({
		where: { id: resProject.project.userId },
		select: {
			id: true,
			name: true,
			email: true,
			updatedAt: true,
			firstName: true,
			lastName: true,
			image: true,
		},
	})
	if (!projectUser) {
		return notFound()
	}

	const resWidgets = await getWidgetsByProjectId(
		resProject.project.id,
		resProject.project.userId,
	)
	const widgets = resWidgets.success ? (resWidgets.widgets ?? []) : []

	const userInitials = `${projectUser.firstName.charAt(0).toUpperCase()}${projectUser.lastName.charAt(0).toUpperCase()}`
	const avatarTimestamp = projectUser.updatedAt.getTime()

	return (
		<div className='container mx-auto space-y-16 relative px-4'>
			<div className='sticky top-4 left-4 right-4 mx-auto z-50'>
				<NavBar isPublic={true} />
			</div>
			<div className='px-6 mb-16'>
				<div className='space-y-8 mb-8'>
					<div>
						<h1 className='text-3xl font-bold'>{resProject.project.name}</h1>
						<p className='text-lg'>{resProject.project.description}</p>
					</div>
					<div className='flex items-center justify-between gap-2 border-t border-b py-4'>
						<div className='flex items-center gap-2'>
							<Avatar className='h-12 w-12 cursor-default'>
								{projectUser?.image ? (
									<AvatarImage
										src={`/api/avatar/${projectUser.id}?v=${avatarTimestamp}`} // Cache busting
										alt={projectUser.name}
										className='object-cover'
									/>
								) : (
									<div className='flex justify-center items-center h-12 w-12 font-bold bg-foreground/10'>
										{userInitials}
									</div>
								)}
							</Avatar>
							<div>
								<p className='text-sm/tight font-bold'>{projectUser.name}</p>
								<Link
									href={`mailto:${projectUser.email}`}
									className='text-xs hover:underline text-muted-foreground'>
									{projectUser?.email}
								</Link>
							</div>
						</div>
						<p className='text-xs text-muted-foreground text-end grow text-nowrap'>
							Last update <br />
							{resProject.project.updatedAt.toLocaleDateString("us-US", {
								year: "numeric",
								month: "short",
								day: "2-digit",
							})}
						</p>
					</div>
				</div>
				<ProjectWidgets
					projectWidgets={widgets}
					widgetsOrder={resProject.project.widgetsOrder || []}
					projectId={resProject.project.id}
					isPublic={true}
					userId={resProject.project.userId}
				/>
			</div>
		</div>
	)
}
