import { ApiRouteConfig, Handlers } from "motia"
import { promises as fs } from "node:fs"
import path from "node:path"
import { z } from "zod"

const CheckFilesSchema = z.object({
	userId: z.string(),
	simId: z.string(),
})

export const config: ApiRouteConfig = {
	name: "CheckInputFiles",
	description: "Validates Python and requirements files before simulation",
	type: "api",
	path: "/simulations/check-files",
	method: "POST",
	bodySchema: CheckFilesSchema,
	flows: ["filesCheck"],
	emits: ["CheckSimulationFiles"],
}

// 5 GB max file size (adjust as needed)
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024

export const handler: Handlers["CheckInputFiles"] = async (
	req: any,
	{ logger }: any
) => {
	try {
		const { userId, simId } = req.body

		const SIMFILES_BASE_DIR =
			process.env.SIMFILES_BASE_DIR ||
			path.resolve(process.cwd(), "..", "data", "simfiles")

		const baseDir = path.join(SIMFILES_BASE_DIR, userId, simId, "input-files")
		try {
			await fs.access(baseDir)
		} catch {
			return {
				status: 404,
				body: { valid: false, errors: [`Path not found: ${baseDir}`] },
			}
		}

		const entries = await fs.readdir(baseDir)
		const pyFiles = entries.filter((f) => f.endsWith(".py"))
		const dataFiles = entries.filter(
			(f) =>
				/\.(csv|json|npy|pkl|pickle|tsv|parquet|xlsx|xls|h5|hdf5|npz|txt|dat|feather)$/i.test(
					f
				) && f.toLowerCase() !== "requirements.txt"
		)
		const reqFileName = entries.find(
			(f) => f.toLowerCase() === "requirements.txt"
		)

		if (!reqFileName) {
			return {
				status: 400,
				body: { valid: false, errors: ["Missing requirements.txt"] },
			}
		}
		if (pyFiles.length === 0) {
			return {
				status: 400,
				body: { valid: false, errors: ["No .py files found"] },
			}
		}

		// Read requirements.txt
		const requirementsTxt = await fs.readFile(
			path.join(baseDir, reqFileName),
			"utf-8"
		)
		const requirements = parseRequirements(requirementsTxt)

		// Read and analyze all .py files + extract file references
		const importsSet = new Set<string>()
		const fileReferencesSet = new Set<string>()

		for (const py of pyFiles) {
			const content = await fs.readFile(path.join(baseDir, py), "utf-8")
			extractImports(content).forEach((imp) => importsSet.add(imp))
			extractFileReferences(content).forEach((ref) =>
				fileReferencesSet.add(ref)
			)
		}
		const imports = Array.from(importsSet)
		const fileReferences = Array.from(fileReferencesSet)

		// Validate package imports
		const missing = imports.filter((imp) => !requirements.includes(imp))

		// Validate file references exist
		const missingFiles = fileReferences.filter((ref) => !entries.includes(ref))

		// Check file sizes and readability
		const fileIssues: { file: string; issue: string }[] = []

		for (const file of [...pyFiles, ...dataFiles]) {
			try {
				const filePath = path.join(baseDir, file)
				const stat = await fs.stat(filePath)

				// Check if readable
				try {
					await fs.access(filePath, fs.constants.R_OK)
				} catch {
					fileIssues.push({ file, issue: "Not readable" })
					continue
				}

				// Check size
				if (stat.size === 0) {
					fileIssues.push({ file, issue: "File is empty" })
				} else if (stat.size > MAX_FILE_SIZE) {
					fileIssues.push({
						file,
						issue: `File too large (${formatBytes(stat.size)} > ${formatBytes(
							MAX_FILE_SIZE
						)})`,
					})
				}
			} catch (error) {
				fileIssues.push({
					file,
					issue: `Cannot access file: ${
						error instanceof Error ? error.message : "Unknown error"
					}`,
				})
			}
		}

		const errors: string[] = []
		if (missing.length > 0) {
			errors.push(`Missing requirements for imports: ${missing.join(", ")}`)
		}
		if (missingFiles.length > 0) {
			errors.push(
				`Missing files referenced in code: ${missingFiles.join(", ")}`
			)
		}
		if (fileIssues.length > 0) {
			const issuesSummary = fileIssues
				.map((i) => `${i.file} (${i.issue})`)
				.join("; ")
			errors.push(`File validation issues: ${issuesSummary}`)
		}

		if (errors.length > 0) {
			return {
				status: 400,
				body: {
					valid: false,
					errors,
					details: {
						baseDir,
						pyFiles,
						dataFiles,
						requirementsFile: reqFileName,
						imports,
						requirements,
						fileReferences,
						missingFiles,
						fileIssues,
					},
				},
			}
		}

		return {
			status: 200,
			body: {
				valid: true,
				message: "Files are valid",
				details: {
					baseDir,
					pyFiles,
					dataFiles,
					requirementsFile: reqFileName,
					imports,
					requirements,
					fileReferences,
				},
			},
		}
	} catch (error) {
		logger.error("Error checking files:", error)
		return { status: 500, body: { valid: false, errors: ["Validation error"] } }
	}
}

function parseRequirements(txt: string): string[] {
	return txt
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith("#"))
		.map((line) => {
			const match = line.match(/^([a-zA-Z0-9_-]+)/)
			return match ? match[1] : ""
		})
		.filter(Boolean)
}

function extractImports(py: string): string[] {
	const STDLIB_MODULES = new Set([
		"os",
		"sys",
		"re",
		"json",
		"time",
		"datetime",
		"math",
		"random",
		"collections",
		"itertools",
		"functools",
		"pathlib",
		"typing",
		"argparse",
		"logging",
		"warnings",
		"copy",
		"pickle",
		"io",
		"threading",
		"multiprocessing",
		"subprocess",
		"unittest",
		"csv",
		"abc",
		"enum",
		"dataclasses",
		"asyncio",
		"contextlib",
		"weakref",
	])

	const importRegex = /^(?:from|import)\s+([a-zA-Z0-9_]+)/gm
	const matches = [...py.matchAll(importRegex)]
	const imports = [...new Set(matches.map((m) => m[1]))]

	return imports.filter((imp) => !STDLIB_MODULES.has(imp))
}

function extractFileReferences(py: string): string[] {
	const fileRefPatterns = [
		/open\s*\(\s*['"]([\w.\-/]+)['"]/gm, // open('file')
		/np\.load\s*\(\s*['"]([\w.\-/]+)['"]/gm, // np.load('file')
		/pd\.read_\w+\s*\(\s*['"]([\w.\-/]+)['"]/gm, // pd.read_csv('file')
		/torch\.load\s*\(\s*['"]([\w.\-/]+)['"]/gm, // torch.load('file')
		/pickle\.load\s*\(\s*['"]([\w.\-/]+)['"]/gm, // pickle.load('file')
		/json\.load\s*\(\s*['"]([\w.\-/]+)['"]/gm, // json.load('file')
		/numpy\.load\s*\(\s*['"]([\w.\-/]+)['"]/gm, // numpy.load('file')
	]

	const files = new Set<string>()
	for (const pattern of fileRefPatterns) {
		const matches = [...py.matchAll(pattern)]
		matches.forEach((m) => {
			const filename = m[1]
			const basename = filename.split("/").pop()
			if (basename) files.add(basename)
		})
	}

	return Array.from(files)
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 Bytes"
	const k = 1024
	const sizes = ["Bytes", "KB", "MB", "GB"]
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}
