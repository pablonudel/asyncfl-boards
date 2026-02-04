import { sendEmailVerificationMsg } from "@/actions/emails/sendEmailVerificationMsg"
import { sendReserPasswordMsg } from "@/actions/emails/sendResetPasswordMsg"
import { GetUserById } from "@/actions/user/user.action"
import { prisma } from "@/lib/prisma"
import { normalizeNames } from "@/lib/utils"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { nextCookies } from "better-auth/next-js"
import { customSession } from "better-auth/plugins/custom-session"

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({ user, url }) => {
			await sendReserPasswordMsg({ user, url })
		},
	},
	emailVerification: {
		autoSignInAfterVerification: true,
		sendOnSignUp: true,
		sendVerificationEmail: async ({ user, url }) => {
			await sendEmailVerificationMsg({ user, url })
		},
	},
	user: {
		additionalFields: {
			firstName: { type: "string", required: true },
			lastName: { type: "string", required: true },
		},
		deleteUser: {
			enabled: true,
		},
		changeEmail: {
			enabled: true,
		},
	},
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			if (ctx.path === "/sign-up/email") {
				if (
					!ctx.body?.email.endsWith("@email.com") &&
					!ctx.body?.email.endsWith("@laas.fr")
				) {
					throw new APIError("BAD_REQUEST", {
						message: "Email domain is not allowed",
					})
				}

				// Normalize names
				const { firstName, lastName } = normalizeNames(
					ctx.body.firstName,
					ctx.body.lastName,
				)
				return {
					context: {
						...ctx,
						body: {
							...ctx.body,
							firstName,
							lastName,
							name: `${firstName} ${lastName}`,
						},
					},
				}
			}
			if (ctx.path === "/update-user") {
				// Normalize names
				const { firstName, lastName } = normalizeNames(
					ctx.body.firstName,
					ctx.body.lastName,
				)
				return {
					context: {
						...ctx,
						body: {
							...ctx.body,
							firstName,
							lastName,
							name: `${firstName} ${lastName}`,
						},
					},
				}
			}
			if (ctx.path === "/change-email") {
				if (
					!ctx.body?.newEmail.endsWith("@email.com") &&
					!ctx.body?.newEmail.endsWith("@laas.fr")
				) {
					throw new APIError("BAD_REQUEST", {
						message: "Email domain is not allowed",
					})
				}
			}
			// if (ctx.path === "/delete-user") {
			// 	const session = await GetSession()
			// 	if (!session || !session.user)
			// 		return { success: false, message: "Unauthorized" }
			// 	try {
			// 		const res = await DeleteAllUserFiles(session.user.id)
			// 		return { context: { ...ctx, body: res } }
			// 	} catch (error) {
			// 		console.error("Error deleting user account:", error)
			// 		throw new APIError("INTERNAL_SERVER_ERROR", {
			// 			message: "Failed to delete user account",
			// 		})
			// 	}
			// }
		}),
	},
	session: {
		expiresIn: 30 * 24 * 60 * 60, // 30 days
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // Cache duration in seconds (5 minutes)
		},
	},
	advanced: {
		database: {
			generateId: false,
		},
	},
	plugins: [
		customSession(async ({ user, session }) => {
			const dbUser = await GetUserById(user.id)
			return {
				...session,
				user: dbUser,
			}
		}),
		nextCookies(),
	],
})

export type ErrorCode = keyof typeof auth.$ERROR_CODES | "UNKNOWN"
