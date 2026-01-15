import * as z from "zod"

const signupSchema = z
	.object({
		name: z.string(),
		firstName: z
			.string()
			.min(2, "First name must be at least 2 characters long")
			.max(50, "First name must be at most 50 characters long"),
		lastName: z
			.string()
			.min(2, "Last name must be at least 2 characters long")
			.max(50, "Last name must be at most 50 characters long"),
		email: z.email("Invalid email address"),
		password: z
			.string()
			.min(8, "Password must be at least 8 characters long")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
				"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
			),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords must match",
		path: ["confirmPassword"],
	})

const signinSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters long")
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
			"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
		),
})

const updateProfileSchema = z.object({
	firstName: z
		.string()
		.min(2, "First name must be at least 2 characters long")
		.max(50, "First name must be at most 50 characters long"),
	lastName: z
		.string()
		.min(2, "Last name must be at least 2 characters long")
		.max(50, "Last name must be at most 50 characters long"),
	email: z.email("Invalid email address"),
})

const updatePasswordSchema = z
	.object({
		currentPassword: z
			.string()
			.min(8, "Password must be at least 8 characters long")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
				"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
			),
		newPassword: z
			.string()
			.min(8, "Password must be at least 8 characters long")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
				"New Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
			),
		confirmPassword: z.string(),
		revokeOtherSessions: z.boolean(),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords must match",
		path: ["confirmPassword"],
	})

export { signinSchema, signupSchema, updatePasswordSchema, updateProfileSchema }
