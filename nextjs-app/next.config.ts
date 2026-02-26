import type { NextConfig } from "next"

const isProduction = process.env.NODE_ENV === "production"
const prodHostname = process.env.NEXT_PUBLIC_PROD_HOSTNAME || "140.93.4.101"

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
				protocol: isProduction ? "https" : "http",
				hostname: isProduction ? prodHostname : "localhost",
				...(isProduction ? {} : { port: "3000" }),
				pathname: "/api/**",
			},
		],
	},
}

export default nextConfig
