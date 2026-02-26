import { sendEmailVerificationMsg } from "@/actions/emails/sendEmailVerificationMsg"
import { sendResetPasswordMsg } from "@/actions/emails/sendResetPasswordMsg"
import { removeAllUserFiles } from "@/actions/files/crudFiles.actions"
import { GetUserById } from "@/actions/user/user.action"
import { prisma } from "@/lib/prisma"
import { normalizeNames } from "@/lib/utils"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { nextCookies } from "better-auth/next-js"
import { admin } from "better-auth/plugins/admin"
import { customSession } from "better-auth/plugins/custom-session"
import { GetSession } from "./session"

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({ user, url }) => {
			await sendResetPasswordMsg({ user, url })
		},
	},
	emailVerification: {
		autoSignInAfterVerification: true,
		sendOnSignUp: true,
		sendVerificationEmail: async ({ user, url }) => {
			const adminEmail = process.env.ADMIN_EMAIL
			if (adminEmail && user.email === adminEmail) {
				console.log("✅ Admin email detected - skipping verification email")
				return // Return early, don't send email
			}

			// Send verification email for regular users
			try {
				await sendEmailVerificationMsg({ user, url })
			} catch (error) {
				console.error("❌ Failed to send verification email:", error)
				// Don't throw - let the signup continue
				// The user can request a new verification email later
			}
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
					!ctx.body?.email.endsWith("@laas.fr") &&
					!ctx.body?.email.endsWith("@asyncfl-boards.laas.fr")
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
			if (ctx.path === "/delete-user") {
				const session = await GetSession()
				if (!session || !session.user)
					return { success: false, message: "Unauthorized" }
				try {
					const res = await removeAllUserFiles()
					return { context: { ...ctx, body: res } }
				} catch (error) {
					console.error("Error deleting user account:", error)
					throw new APIError("INTERNAL_SERVER_ERROR", {
						message: "Failed to delete user account",
					})
				}
			}
		}),
		after: createAuthMiddleware(async (ctx) => {
			// Auto-verify and promote admin after signup
			if (ctx.path === "/sign-up/email" && ctx.returned?.user) {
				const adminEmail = process.env.ADMIN_EMAIL
				const userEmail = ctx.returned.user.email
				const userId = ctx.returned.user.id

				if (adminEmail && userEmail === adminEmail) {
					console.log("✅ Auto-configuring admin user")

					try {
						// Use better-auth API to set role (compatible with admin plugin)
						await auth.api.setRole({
							body: {
								userId: userId,
								role: "admin",
							},
						})

						// Verify email through Prisma (better-auth doesn't have API for this)
						await prisma.user.update({
							where: { id: userId },
							data: { emailVerified: true },
						})

						console.log("✅ Admin configured: role=admin, emailVerified=true")
					} catch (error) {
						console.error("❌ Error configuring admin:", error)
						// Fallback: direct Prisma update
						await prisma.user.update({
							where: { id: userId },
							data: {
								role: "admin",
								emailVerified: true,
							},
						})
						console.log("✅ Admin configured via fallback")
					}
				}
			}
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
		admin({
			defaultRole: "user",
		}),
	],
})

export type ErrorCode = keyof typeof auth.$ERROR_CODES | "UNKNOWN"
