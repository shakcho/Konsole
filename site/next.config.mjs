import webpack from 'next/dist/compiled/webpack/webpack-lib.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/docs',
        destination: 'https://konsole-docs.vercel.app/',
      },
      {
        source: '/docs/:path*',
        destination: 'https://konsole-docs.vercel.app/:path*',
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // konsole-logger keeps node:* as Rollup externals (for FileTransport/StreamTransport).
      // They're never called client-side, but webpack chokes on the node: URI scheme.
      // This plugin rewrites node:* imports to empty modules.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, '');
        }),
      );

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        os: false,
        process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
