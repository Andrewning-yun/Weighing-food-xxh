/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@fastfood-kitchen/api-client',
    '@fastfood-kitchen/config',
    '@fastfood-kitchen/design-tokens',
    'tdesign-react',
    'tdesign-icons-react',
  ],
  async rewrites() {
    const apiTarget = process.env.API_BASE_URL || 'http://127.0.0.1:3000/api';
    return [
      {
        source: '/api/:path*',
        destination: `${apiTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
