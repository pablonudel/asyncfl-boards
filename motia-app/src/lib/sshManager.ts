import { Client } from "ssh2"

interface SSHSession {
	client: Client
	sftp: any
	lastAccess: number
}

const TARGET_HOST = process.env.TARGET_HOST
const TUNNEL_HOST = process.env.TUNNEL_HOST

class SSHManager {
	private static instance: SSHManager
	// Mapa para soportar múltiples usuarios simultáneos
	private sessions: Map<string, SSHSession> = new Map()
	private readonly IDLE_TIMEOUT = 60 * 60 * 1000 // 1 hora

	private constructor() {
		// Chequeo de inactividad cada minuto
		setInterval(() => this.cleanupIdleSessions(), 60000)
	}

	static getInstance() {
		if (!SSHManager.instance) SSHManager.instance = new SSHManager()
		return SSHManager.instance
	}

	async getSession(userId: string, userName: string, userPassword: string) {
		if (!TARGET_HOST || !TUNNEL_HOST) {
			throw new Error("Pfcalcul env configuration is missing")
		}
		const existing = this.sessions.get(userId)
		if (existing) {
			existing.lastAccess = Date.now()
			return { sftp: existing.sftp, client: existing.client }
		}

		return new Promise((resolve, reject) => {
			const conn = new Client()

			conn
				.on("ready", () => {
					conn.forwardOut("127.0.0.1", 0, TARGET_HOST, 22, (err, stream) => {
						if (err) return reject(err)

						const finalConn = new Client()
						finalConn
							.on("ready", () => {
								finalConn.sftp((err, sftpSession) => {
									if (err) return reject(err)

									this.sessions.set(userId, {
										client: finalConn,
										sftp: sftpSession,
										lastAccess: Date.now(),
									})

									resolve({ sftp: sftpSession, client: finalConn })
								})
							})
							.on("error", (err) => {
								this.sessions.delete(userId)
								reject(err)
							})
							.connect({
								sock: stream,
								username: userName,
								password: userPassword,
								keepaliveInterval: 10000,
							})
					})
				})
				.on("error", (err) => reject(err))
				.connect({
					host: TUNNEL_HOST,
					username: userName,
					password: userPassword,
					port: 22,
				})
		})
	}

	private cleanupIdleSessions() {
		const now = Date.now()
		for (const [userId, session] of this.sessions.entries()) {
			if (now - session.lastAccess > this.IDLE_TIMEOUT) {
				session.client.end()
				this.sessions.delete(userId)
				console.log(`Sesión de ${userId} cerrada por inactividad.`)
			}
		}
	}

	// Utilidad para ejecutar comandos y recibir el resultado como Promesa
	async runCommand(client: Client, command: string): Promise<string> {
		return new Promise((resolve, reject) => {
			client.exec(command, (err, stream) => {
				if (err) return reject(err)
				let output = ""
				stream.on("data", (data: any) => (output += data.toString()))
				stream.on("close", () => resolve(output.trim()))
				stream.stderr.on("data", (data: any) => reject(data.toString()))
			})
		})
	}

	// Utilidad para subir archivos
	async uploadFile(
		userId: string,
		localPath: string,
		remotePath: string,
	): Promise<void> {
		const session = this.sessions.get(userId)

		if (!session || !session.sftp) {
			throw new Error(
				`No hay una sesión SFTP activa para el usuario: ${userId}`,
			)
		}

		return new Promise((resolve, reject) => {
			// fastPut es ideal para transferencias rápidas
			session.sftp.fastPut(localPath, remotePath, (err: Error | null) => {
				if (err) {
					console.error(`Error subiendo archivo ${localPath}:`, err)
					return reject(err)
				}
				// Actualizamos el acceso para que la sesión no expire
				session.lastAccess = Date.now()
				resolve()
			})
		})
	}
}

export const sshManager = SSHManager.getInstance()
