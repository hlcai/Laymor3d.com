import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

function resolveLocalLinkedRoot(): string | undefined {
  try {
    const cwd = process.cwd();
    const nmPath = path.join(cwd, "node_modules");
    const realNm = fs.realpathSync(nmPath);
    if (realNm.toLowerCase() !== path.resolve(nmPath).toLowerCase()) {
      return path.resolve(cwd, "..");
    }
  } catch {
    // Default to standard Next.js project root on Vercel / regular installs
  }
  return undefined;
}

const linkedRoot = resolveLocalLinkedRoot();

const nextConfig: NextConfig = {
  ...(linkedRoot ? { turbopack: { root: linkedRoot } } : {}),
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.vietqr.io',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
      {
        protocol: 'https',
        hostname: '*.bblmw.com',
      },
      {
        protocol: 'https',
        hostname: 'makerworld.bblmw.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.thingiverse.com',
      },
      {
        protocol: 'https',
        hostname: 'media.printables.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'fal.media',
      },
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
  async rewrites() {
    const rules = [
      {
        source: '/3dsim',
        destination: '/3dsim/index.html',
      },
      {
        source: '/3dsim/',
        destination: '/3dsim/index.html',
      },
    ];
    if (process.env.SIMULATOR_BACKEND_URL) {
      rules.push({
        source: '/api/v1/:path*',
        destination: `${process.env.SIMULATOR_BACKEND_URL}/api/v1/:path*`,
      });
    }
    return rules;
  },
};

export default nextConfig;
