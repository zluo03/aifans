import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 优化构建性能
  experimental: {
    optimizePackageImports: ['@blocknote/core', '@blocknote/react', '@blocknote/mantine'],
  },
  // Webpack优化
  webpack: (config, { dev, isServer }) => {
    // 开发和生产环境都进行优化
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          // 将BlockNote相关依赖打包到单独的chunk
          blocknote: {
            test: /[\\/]node_modules[\\/]@blocknote[\\/]/,
            name: 'blocknote',
            chunks: 'async', // 只对异步chunk进行分割
            priority: 10,
            enforce: true,
          },
          // Mantine UI库单独分割
          mantine: {
            test: /[\\/]node_modules[\\/]@mantine[\\/]/,
            name: 'mantine',
            chunks: 'async',
            priority: 9,
          },
          // Radix UI组件单独分割
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix',
            chunks: 'async',
            priority: 8,
          },
        },
      },
    };

    return config;
  },
  images: {
    domains: ['localhost', '127.0.0.1', process.env.NEXT_PUBLIC_DOMAIN || 'localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: process.env.NEXT_PUBLIC_DOMAIN || 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_DOMAIN || 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '*.qlogo.cn',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.qlogo.cn',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true,
  },
  async rewrites() {
    // 从环境变量获取API基础URL，默认为localhost:3001
    const apiBaseUrl = process.env.API_URL || 'http://localhost:3001';
    console.log(`配置API代理: ${apiBaseUrl}`);
    
    return [
      // 之前已有的规则
      {
        source: '/api/creators/:path*',
        destination: `${apiBaseUrl}/api/creators/:path*`,
      },
      // 添加微信认证相关路由
      {
        source: '/api/auth/wechat/:path*',
        destination: `${apiBaseUrl}/api/auth/wechat/:path*`,
      },
      // 添加静态资源代理 - 确保优先级高于其他规则
      {
        source: '/uploads/:path*',
        destination: `${apiBaseUrl}/uploads/:path*`,
      },
      // 添加所有其他API路由的通用规则
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
