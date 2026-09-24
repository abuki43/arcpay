/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@arcpay/sdk'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      '@x402/core/client': false,
      '@x402/svm/exact/client': false,
      '@x402/evm': false,
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
};

export default nextConfig;
