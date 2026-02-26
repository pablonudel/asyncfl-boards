// prisma/seed.ts
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import "dotenv/config"

async function createAdmin() {
	const email = process.env.ADMIN_EMAIL
	const password = process.env.ADMIN_PASSWORD

	if (!email || !password) {
		console.error(
			"ERROR: ADMIN_EMAIL or ADMIN_PASSWORD are not defined in .env file",
		)
		process.exit(1)
	}

	if (password.length < 8) {
		console.error("ERROR: ADMIN_PASSWORD must have at least 8 characters")
		process.exit(1)
	}

	try {
		const adminExists = await prisma.user.findUnique({ where: { email } })

		if (adminExists) {
			console.log(`Admin exists (${email}, ID: ${adminExists.id})`)
			console.log("Seed completed - without unnecessary operations.")
			return
		}

		console.log(`Creating admin user: ${email}`)

		await auth.api.signUpEmail({
			body: {
				email: email,
				password: password,
				name: "Admin User",
				firstName: "Admin",
				lastName: "User",
			},
		})

		await prisma.user.update({
			where: { email },
			data: {
				role: "admin",
				emailVerified: true,
			},
		})

		console.log("Admin user created successfully:")
		console.log(`   Email: ${email}`)
		console.log("   Role: admin")
		console.log("   Email verified: true")
	} catch (error) {
		console.error("Error en el seed:", error)
		throw error
	} finally {
		await prisma.$disconnect()
	}
}

createAdmin()
	.then(() => {
		console.log("Seed proccess completed successfully.")
		process.exit(0)
	})
	.catch((error) => {
		console.error("Seed failed:", error)
		process.exit(1)
	})
