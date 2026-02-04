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
		remotePatterns: [new URL(`${process.env.NEXT_PUBLIC_S3_BUCKET_URL}/**/*`)],
	},
}

export default nextConfig
