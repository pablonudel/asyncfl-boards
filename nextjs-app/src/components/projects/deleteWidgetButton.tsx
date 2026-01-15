import { deleteWidget } from "@/actions/widgets/crudWidgets.actions"
import { Trash } from "lucide-react"
import { toast } from "sonner"
import { useSWRConfig } from "swr"
import { Button } from "../ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog"

export default function DeleteWidgetButton({
	widgetId,
	projectId,
}: {
	widgetId: string
	projectId: string
}) {
	const { mutate } = useSWRConfig()
	async function handleDeleteWidget() {
		const res = await deleteWidget(widgetId)
		if (!res?.success) {
			toast.error(res?.message)
			return
		}
		await mutate(`/api/projects/${projectId}/widgets`)
		toast.success(res?.message)
	}
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					variant='secondary'
					size='icon'
					className='rounded-full w-8 h-8'>
					<Trash className='text-destructive' />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Widget</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete this widget?
					</DialogDescription>
					<DialogFooter>
						<Button variant='destructive' onClick={handleDeleteWidget}>
							Confirm Delete
						</Button>
					</DialogFooter>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	)
}
