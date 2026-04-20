/** @type {import('next').NextConfig} */
const isProf = process.env.NODE_ENV === 'production';
const nextConfig = {
  /* config options here */
  output:'export',
  basePath: isProf? '/csr_portal':'',
  images:
  {
    unoptimized: true,
  },
  reactCompiler: true,
  eslint: {ignoreDuringBuilds: true},
  typescript: {ignoreBuildErrors: true},
};

export default nextConfig;
