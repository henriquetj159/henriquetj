import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  transpilePackages: ['@ciclo/ui', '@ciclo/utils', '@ciclo/auth', '@ciclo/database'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  experimental: {
    optimizePackageImports: ['@ciclo/ui'],
  },
}

export default nextConfig
