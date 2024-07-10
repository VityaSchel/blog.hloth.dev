import nexti18next from './next-i18next.config.js'
import withNextPWA from 'next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg'),
    )

    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/,
      },
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] },
        use: ['@svgr/webpack'],
      },
    )

    fileLoaderRule.exclude = /\.svg$/i

    return config
  },
  images: {
    remotePatterns: [
      {
        hostname: 'blog.hloth.dev',
        protocol: 'https',
        pathname: '/files/*',
      }
    ]
  },
  i18n: nexti18next.i18n,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  // experimental: {
    
  //   turbo: {
  //     rules: {
  //       '*.svg': {
  //         loaders: ['@svgr/webpack'],
  //         as: '*.js',
  //       },
  //     },
  //   },
  // },
}

export default withNextPWA({
  dest: 'public',
  // disable: process.env.NODE_ENV === 'development'
})(nextConfig)
