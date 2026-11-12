import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The system packages export TypeScript and CSS source (DECISIONS.md,
  // structure 2), so Next compiles them like app code.
  transpilePackages: [
    '@the-system/react',
    '@the-system/shared',
    '@the-system/icons',
    '@the-system/motion',
    '@the-system/styles',
    '@the-system/css',
    '@the-system/tokens',
  ],
  poweredByHeader: false,
  // `next dev` otherwise writes an AGENTS.md into the app folder. This repo
  // keeps one set of agent rules at the root.
  agentRules: false,
  // The locale is the first route segment. The bare root goes to English.
  async redirects() {
    return [{ source: '/', destination: '/en', permanent: false }];
  },
};

export default nextConfig;
