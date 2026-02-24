import {
	Button,
	Container,
	Head,
	Heading,
	Html,
	pixelBasedPreset,
	Tailwind,
	Text,
} from "@react-email/components"

export default function ResetPassword({
	user,
	url,
}: {
	user: { name: string }
	url: string
}) {
	return (
		<Html>
			<Tailwind
				config={{
					presets: [pixelBasedPreset],
				}}>
				<Container>
					<Head>
						<Heading as='h1'>Reset Password</Heading>
					</Head>
					<Text>Hello {user.name || "User"},</Text>
					<Text>Please reset your password by clicking the button below:</Text>
					<Button
						href={url}
						className='box-border rounded-[8px] bg-indigo-600 px-[12px] py-[12px] text-center font-semibold text-white'>
						Reset Password
					</Button>
					<Text>
						If you did not request this reset, please ignore this email.
					</Text>
					<Text>
						Thank you,
						<br />
						AsyncFL-Boards
					</Text>
				</Container>
			</Tailwind>
		</Html>
	)
}
