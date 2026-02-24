import { getUserSession } from "@/actions/auth/auth.actions"
import { getUserFiles } from "@/data/filesData"
import { Files } from "lucide-react"
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "../ui/empty"
import FileItem from "./fileItem"

export default async function FilesList() {
	const session = await getUserSession()
	if (!session.user) return null
	const user = session.user

	const res = await getUserFiles(user.id)
	const files = res.files ?? []

	files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

	if (files.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant='icon'>
						<Files />
					</EmptyMedia>
					<EmptyTitle>No files available</EmptyTitle>
					<EmptyDescription>
						You haven&apos;t uploaded any files yet.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		)
	}

	return (
		<div className='space-y-2'>
			{files.map((file) => (
				<FileItem key={file.id} file={file} />
			))}
		</div>
	)
}
