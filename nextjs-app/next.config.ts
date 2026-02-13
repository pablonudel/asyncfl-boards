import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	cacheComponents: true,
	experimental: {
		globalNotFound: true,
		serverActions: {
			bodySizeLimit: "5mb",
		},
	},
	images: {
		remotePatterns: [
			{
				protocol: "http", // o 'https' en producción
				hostname: "localhost",
				port: "3000",
				pathname: "/api/**",
			},
		],
	},
}

export default nextConfig
