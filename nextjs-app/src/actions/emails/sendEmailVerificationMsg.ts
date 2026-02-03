import EmailVerification from "@/components/emails/emailVerification"
import { transporter } from "@/lib/nodemailer"
import { render } from "@react-email/components"

export async function sendEmailVerificationMsg({
	user,
	url,
}: {
	user: { name: string; email: string }
	url: string
}) {
	const emailHtml = await render(EmailVerification({ user, url }))
	try {
		await transporter.sendMail({
			from: '"AsyncFL-Boards" <no-reply@laas.fr>',
			to: user.email,
			subject: "Email Verification",
			text: `Hello ${
				user.name || "User"
			},\n\nPlease verify your email address by clicking the link below:\n\n${url}\n\nIf you did not request this verification, please ignore this email.\n\nThank you,\nAsyncFL-Boards`,
			html: emailHtml,
		})
	} catch (error) {
		console.error("Error while sending mail", error)
		throw new Error("Error while sending mail", { cause: error })
	}
}
