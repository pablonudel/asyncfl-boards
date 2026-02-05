import { getUserSession } from "@/actions/auth/auth.actions"
import DeleteProjectButton from "@/components/projects/deleteProjectButton"
import EditProjectForm from "@/components/projects/editProjectForm"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { getUserProjectById } from "@/data/projectsData"
import Link from "next/link"
import { Suspense } from "react"

export default async function Page({
	params,
}: {
	params: Promise<{ projectId: string }>
}) {
	return (
		<Suspense fallback={<div>Loading project settings...</div>}>
			<ProjectDataWrapper params={params}>
				{(project) => (
					<div className='space-y-4'>
						<div className='flex justify-between items-center'>
							<div className='flex gap-2 items-baseline'>
								<Link
									href={`/projects`}
									className=' text-muted-foreground font-light hover:text-foreground'>
									Projects
								</Link>
								<span className=' text-muted-foreground font-light'>/</span>
								<Link
									href={`/projects/${project?.id}`}
									className=' text-muted-foreground font-light hover:text-foreground'>
									{project?.name}
								</Link>
								<span className=' text-muted-foreground font-light'>/</span>
								<h1 className='text-2xl font-bold'>Settings</h1>
							</div>
							<DeleteProjectButton projectId={project?.id} />
						</div>
						<div className='flex flex-col xl:flex-row gap-4'>
							<div className='w-full xl:w-1/2 space-y-4'>
								<Card>
									<CardHeader>
										<h2 className='text-lg font-semibold'>Project Info</h2>
									</CardHeader>
									<CardContent>
										<EditProjectForm project={project} />
									</CardContent>
								</Card>
							</div>
							{/* <div className='flex flex-col w-full xl:w-1/2 space-y-4'>
								<Card>
									<CardHeader>
										<h2 className='text-lg font-semibold'>Project Files</h2>
									</CardHeader>
									<CardContent className='space-y-4'>
										{project.files.length > 0 ? (
											<ul className='space-y-1'>
												{project.files.map(
													(file: (typeof project.files)[number]) => (
														<li key={file.id}>
															<FileItem file={file} projectId={project.id} />
														</li>
													),
												)}
											</ul>
										) : (
											<p>No files uploaded</p>
										)}
										<FileUploader projectId={project.id} />
									</CardContent>
								</Card>
							</div> */}
						</div>
					</div>
				)}
			</ProjectDataWrapper>
		</Suspense>
	)
}

async function ProjectDataWrapper({
	params,
	children,
}: {
	params: Promise<{ projectId: string }>
	children: (project: any) => React.ReactNode
}) {
	const { projectId } = await params
	const session = await getUserSession()
	if (!session || !session.user) return null
	const user = session.user
	const resProjects = await getUserProjectById(projectId, user!.id)

	const project: typeof resProjects.project =
		resProjects.success && resProjects.project ? resProjects.project : undefined

	return children(project)
}
