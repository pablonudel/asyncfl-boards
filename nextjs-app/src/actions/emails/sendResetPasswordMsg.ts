import ResetPassword from "@/components/emails/resetPassword"
import { transporter } from "@/lib/nodemailer"
import { render } from "@react-email/components"

/**
 * Sends a reset password message to the user.
 * @param user
 * @param url
 */
export async function sendResetPasswordMsg({
	user,
	url,
}: {
	user: { name: string; email: string }
	url: string
}) {
	const emailHtml = await render(ResetPassword({ user, url }))
	try {
		await transporter.sendMail({
			from: '"AsyncFL-Boards" <no-reply@laas.fr>',
			to: user.email,
			subject: "Reset Password",
			text: `Hello ${
				user.name || "User"
			},\n\nPlease reset your password by clicking the link below:\n\n${url}\n\nIf you did not request this reset, please ignore this email.\n\nThank you,\nAsyncFL-Boards`,
			html: emailHtml,
		})
	} catch (error) {
		console.error("Error while sending mail", error)
		throw new Error("Error while sending mail", { cause: error })
	}
}
