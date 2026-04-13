/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output:'export',
  basePath: '/csr-portal',
  images:
  {
    unoptimized: true,
  },
  reactCompiler: true,
  eslint: {ignoreDuringBuilds: true},
  typescript: {ignoreBuildErrors: true},
};

export default nextConfig;
