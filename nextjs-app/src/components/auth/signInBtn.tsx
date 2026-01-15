import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SignInBtn() {
	return (
		<Button asChild>
			<Link href='/auth/signin'>Sign In</Link>
		</Button>
	)
}
