import FilesList from "@/components/files/filesList"
import FileUploader from "@/components/files/fileUploader"
import { Suspense } from "react"

export default function Page() {
	return (
		<>
			<h1 className='text-2xl font-bold mb-8'>Files</h1>
			<div className='space-y-2'>
				<FileUploader />
				<Suspense fallback={<div>Loading projects...</div>}>
					<FilesList />
				</Suspense>
			</div>
		</>
	)
}
