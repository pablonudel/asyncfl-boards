import { getUserSession } from "@/actions/auth/auth.actions"
import CreateProjectBtn from "./createProjectBtn"
import EditProjectBtn from "./editProjectBtn"

type project = {
	id: string
	name: string
	createdAt: Date
	updatedAt: Date
	description: string | null
}

export default async function CreateEditProjectWrapper({
	mode,
	project,
}: {
	mode: "create" | "edit"
	project?: project
}) {
	const session = await getUserSession()
	if (!session.user) return null
	const user = session.user

	return (
		<>
			{mode === "edit" && project ? (
				<EditProjectBtn project={project} userId={user.id} />
			) : (
				<CreateProjectBtn mode={mode} userId={user.id} />
			)}
		</>
	)
}
