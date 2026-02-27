// ══════════════════════════════════════════════════════════════════════
// Pareto calculations for FL optimization using queuing theory and performance metrics evaluation.
// ══════════════════════════════════════════════════════════════════════

/**
 * Calculates the normalization constant Z for a closed queuing network using Buzen's algorithm.
 * @param numClients
 * @param numTasks
 * @param routing
 * @param compSpeeds
 * @param uplinkSpeeds
 * @param downlinkSpeeds
 * @returns The normalization constant Z as a Float64Array where Z[m] is the value for m tasks in the system.
 */
export function buzenAlgo(
	numClients: number,
	numTasks: number,
	routing: number[],
	compSpeeds: number[],
	uplinkSpeeds: number[],
	downlinkSpeeds: number[],
): Float64Array {
	const Z = new Float64Array(numTasks + 1)
	Z[0] = 1.0

	// Estaciones M/M/1 (computación)
	for (let i = 0; i < numClients; i++) {
		const rho = routing[i] / compSpeeds[i]
		for (let m = 1; m <= numTasks; m++) {
			Z[m] += rho * Z[m - 1]
		}
	}

	// Estaciones M/M/∞ (uplink + downlink)
	const rhoInf = [
		...uplinkSpeeds.map((s, i) => routing[i] / s),
		...downlinkSpeeds.map((s, i) => routing[i] / s),
	]

	for (const rho of rhoInf) {
		const y = new Float64Array(numTasks + 1)
		y[0] = 1.0
		for (let k = 1; k <= numTasks; k++) {
			y[k] = (y[k - 1] * rho) / k
		}

		const Zprev = Z.slice()
		for (let k = 1; k <= numTasks; k++) {
			for (let m = numTasks; m >= k; m--) {
				Z[m] += y[k] * Zprev[m - k]
			}
		}
	}

	return Z
}

/**
 * Calculates the expected delay (ED) for each client given a routing configuration and the normalization constant Z.
 * @param routing
 * @param numTasks
 * @param Z
 * @param compSpeeds
 * @param uplinkSpeeds
 * @param downlinkSpeeds
 * @returns A Float64Array where each element is the expected delay for the corresponding client.
 */
export function edVector(
	routing: number[],
	numTasks: number,
	Z: Float64Array,
	compSpeeds: number[],
	uplinkSpeeds: number[],
	downlinkSpeeds: number[],
): Float64Array {
	const n = routing.length
	const ED = new Float64Array(n)
	const denom = Z[numTasks - 1]

	for (let i = 0; i < n; i++) {
		const r = routing[i] / compSpeeds[i]
		let val = 0
		for (let k = 0; k < numTasks - 1; k++) {
			val += Math.pow(r, k) * Z[numTasks - 2 - k]
		}
		const infTerm =
			Z[numTasks - 2] *
			routing[i] *
			(1 / uplinkSpeeds[i] + 1 / downlinkSpeeds[i])
		ED[i] = (r * val + infTerm) / denom
	}

	return ED
}

/**
 * Evaluates the performance metrics (tau, total time, T2, T3, throughput) for a given routing configuration and FL parameters.
 * @param routing
 * @param m
 * @param networkConfig
 * @param flParams
 * @returns An object containing the calculated metrics: tau, totalTime, T2, T3, and throughput.
 */
export function evaluateMetrics(
	routing: number[],
	m: number,
	networkConfig: any,
	flParams: any,
) {
	const { computation_speeds, uplink_speeds, downlink_speeds } = networkConfig
	const { L, A, epsilon, sigma, G, M: Mparam } = flParams
	const n = routing.length

	const B = 2 * Mparam * Mparam + sigma * sigma
	const C = G * G + sigma * sigma

	const Z = buzenAlgo(
		n,
		m,
		routing,
		computation_speeds,
		uplink_speeds,
		downlink_speeds,
	)
	const ED = edVector(
		routing,
		m,
		Z,
		computation_speeds,
		uplink_speeds,
		downlink_speeds,
	)

	let sumInvR = 0
	let sumEDinvR2 = 0
	for (let i = 0; i < n; i++) {
		const invR = 1 / routing[i]
		sumInvR += invR
		sumEDinvR2 += ED[i] * invR * invR
	}

	const T2 = ((4 + (6 * B) / epsilon) * sumInvR) / n
	const T3 = Math.sqrt((3 * C * (m - 1) * sumEDinvR2) / epsilon)
	const totalTime = ((T2 + T3) * 24 * L * A) / (n * epsilon)
	const throughput = Z[m - 1] / Z[m]

	return {
		tau: totalTime / throughput,
		totalTime,
		T2,
		T3,
		throughput,
	}
}

/**
 * Evaluates the energy consumption for a given routing configuration and FL parameters based on the calculated total time and energy per round.
 * @param routing
 * @param m
 * @param networkConfig
 * @param flParams
 * @returns The total energy consumption for the given routing configuration and FL parameters.
 */
export function evaluateEnergy(
	routing: number[],
	m: number,
	networkConfig: any,
	flParams: any,
): number {
	const {
		computation_speeds,
		uplink_speeds,
		downlink_speeds,
		computation_energy,
		uplink_energy,
		downlink_energy,
	} = networkConfig

	const { totalTime } = evaluateMetrics(routing, m, networkConfig, flParams)

	let energyPerRound = 0
	for (let i = 0; i < routing.length; i++) {
		energyPerRound +=
			routing[i] *
			(uplink_energy[i] / uplink_speeds[i] +
				downlink_energy[i] / downlink_speeds[i] +
				computation_energy[i] / computation_speeds[i])
	}

	return totalTime * energyPerRound
}

/**
 * Calculates the proportions of tasks assigned to each client based on their weights and counts using a weighted average approach.
 * @param weights
 * @param counts
 * @returns An array of proportions for each client, where the sum of all proportions equals 1.
 */
export function calculateProportions(
	weights: number[],
	counts: number[],
): number[] {
	const totalWeighted = weights.reduce((sum, w, i) => sum + w * counts[i], 0)
	return weights.map((w, i) => (w * counts[i]) / totalWeighted)
}

/**
 * Builds the full routing vector for the queuing network based on the calculated proportions and the number of devices for each client. Each client's proportion is distributed equally among its devices.
 * @param proportions
 * @param devices
 * @returns An array representing the routing configuration for each device in the system, where each element corresponds to the proportion of tasks assigned to that device.
 */
export function buildFullRouting(
	proportions: number[],
	devices: any[],
): number[] {
	const routing: number[] = []

	devices.forEach((device, i) => {
		const proportion = proportions[i]
		const perClient = proportion / device.count

		for (let j = 0; j < device.count; j++) {
			routing.push(perClient)
		}
	})

	return routing
}
