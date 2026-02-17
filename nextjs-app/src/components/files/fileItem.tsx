import type { File } from "@/generated/prisma/client"
import { File as FileIcon } from "lucide-react"
import {
	Item,
	ItemActions,
	ItemContent,
	ItemMedia,
	ItemTitle,
} from "../ui/item"
import DeleteFileButton from "./deleteFileButton"
import FileReferenceForm from "./fileReferenceForm"

export default function FileItem({ file }: { file: File }) {
	function formatFileSize(size: number) {
		if (size < 1000) return `${size} B`
		else if (size < 1_000_000) return `${Math.round(size / 1000)} KB`
		else return `${(size / 1_000_000).toFixed(2)} MB`
	}

	return (
		<Item variant='muted'>
			<ItemMedia className='md:flex flex-col hidden px-4'>
				<FileIcon />
				<p className='text-xs'>{formatFileSize(file.fileSize)}</p>
			</ItemMedia>
			<ItemContent className='overflow-hidden'>
				<ItemTitle className='w-full'>
					<FileReferenceForm file={file} />
				</ItemTitle>
				<div className='space-y-1 text-muted-foreground'>
					<p className='text-xs truncate'>
						<span className='font-bold'>File name:</span> {file.fileName}
					</p>
					<p className='text-xs block md:hidden truncate'>
						<span className='font-bold'>File Size:</span>{" "}
						{formatFileSize(file.fileSize)}
					</p>
					{file.createdAt.getTime() !== file.updatedAt.getTime() ? (
						<p className='text-xs truncate'>
							<span className='font-bold'>Updated at:</span>{" "}
							{file.updatedAt.toLocaleString()}
						</p>
					) : (
						<p className='text-xs truncate'>
							<span className='font-bold'>Created at:</span>{" "}
							{file.createdAt.toLocaleString()}
						</p>
					)}
				</div>
			</ItemContent>
			<ItemActions>
				<DeleteFileButton file={file} />
			</ItemActions>
		</Item>
	)
}
