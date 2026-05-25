/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', '../../lib/parsePdf.cjs'],
}

export default nextConfig
