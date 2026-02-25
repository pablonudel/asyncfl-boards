// prisma/seed.ts
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import "dotenv/config"

async function createAdmin() {
	const email = process.env.ADMIN_EMAIL
	const password = process.env.ADMIN_PASSWORD

	if (!email || !password) {
		throw new Error(
			"ADMIN_EMAIL o ADMIN_PASSWORD no están definidos en el .env",
		)
	}

	try {
		// Usamos findUnique en lugar de findUniqueOrThrow para manejar la lógica nosotros
		const adminExists = await prisma.user.findUnique({ where: { email } })

		if (!adminExists) {
			console.log("Creando usuario administrador...")

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
				data: { role: "admin", emailVerified: true },
			})
			console.log("✅ Admin creado exitosamente.")
		} else {
			console.log("ℹ️ El admin ya existe, saltando seed.")
		}
	} catch (error) {
		console.error("❌ Error en el seed:", error)
	}
}

createAdmin()
