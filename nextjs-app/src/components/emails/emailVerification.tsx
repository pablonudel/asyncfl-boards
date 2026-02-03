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

export default function EmailVerification({
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
						<Heading as='h1'>Email Verification</Heading>
					</Head>
					<Text>Hello {user.name || "User"},</Text>
					<Text>
						Please verify your email address by clicking the link below:
					</Text>
					<Button href={url}>Verify Email</Button>
					<Text>
						If you did not request this verification, please ignore this email.
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
