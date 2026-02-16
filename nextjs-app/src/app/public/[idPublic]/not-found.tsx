import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty"
import { LayoutDashboard } from "lucide-react"

export default function Page() {
	return (
		<Empty className='h-dvh'>
			<EmptyHeader>
				<EmptyMedia variant='icon'>
					<LayoutDashboard />
				</EmptyMedia>
				<EmptyTitle>Project Not Found</EmptyTitle>
				<EmptyDescription>
					Please check the URL or contact the project owner for more
					information.
				</EmptyDescription>
			</EmptyHeader>
		</Empty>
	)
}
