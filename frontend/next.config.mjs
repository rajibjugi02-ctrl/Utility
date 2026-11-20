/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverComponentsExternalPackages: ['@neplex/vectorizer'],
  },
  eslint: {
    // Mematikan error linting saat proses build Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Memastikan build Vercel tidak terhenti karena warning TypeScript
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
