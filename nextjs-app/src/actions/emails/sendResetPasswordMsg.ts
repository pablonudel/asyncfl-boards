import ResetPassword from "@/components/emails/resetPassword"
import { transporter } from "@/lib/nodemailer"
import { render } from "@react-email/components"

export async function sendReserPasswordMsg({
	user,
	url,
}: {
	user: { name: string; email: string }
	url: string
}) {
	const emailHtml = await render(ResetPassword({ user, url }))
	try {
		await transporter.sendMail({
			from: '"Sara.IO" <no-reply@laas.fr>',
			to: user.email,
			subject: "Reset Password",
			text: `Hello ${
				user.name || "User"
			},\n\nPlease reset your password by clicking the link below:\n\n${url}\n\nIf you did not request this reset, please ignore this email.\n\nThank you,\nSara Team`,
			html: emailHtml,
		})
	} catch (error) {
		console.error("Error while sending mail", error)
		throw new Error("Error while sending mail", { cause: error })
	}
}
