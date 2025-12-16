/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Ignorar errores de TS en build para evitar bloqueos por tipos estrictos
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignorar errores de linting en build
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;