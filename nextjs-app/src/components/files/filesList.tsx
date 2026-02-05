import { getUserSession } from "@/actions/auth/auth.actions"
import { getUserFiles } from "@/data/filesData"
import FileItem from "./fileItem"

export default async function FilesList() {
	const session = await getUserSession()
	if (!session.user) return null
	const user = session.user

	const res = await getUserFiles(user.id)
	const files = res.files ?? []

	if (files.length === 0) {
		return <div>No files uploaded yet.</div>
	}

	return (
		<div className='space-y-2'>
			{files.map((file) => (
				<FileItem key={file.id} file={file} />
			))}
		</div>
	)
}
