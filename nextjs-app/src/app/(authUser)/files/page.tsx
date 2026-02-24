import FilesList from "@/components/files/filesList"
import FileUploader from "@/components/files/fileUploader"
import { Spinner } from "@/components/ui/spinner"
import { Suspense } from "react"

export default function Page() {
	return (
		<>
			<h1 className='text-2xl font-bold mb-8'>Files</h1>
			<div className='space-y-2'>
				<FileUploader />
				<Suspense
					fallback={
						<div className='flex items-center justify-center'>
							<Spinner className='size-8' />
						</div>
					}>
					<FilesList />
				</Suspense>
			</div>
		</>
	)
}
