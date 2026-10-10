import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist ships ESM-only .mjs files; must NOT be bundled by webpack
  serverExternalPackages: ['pdfjs-dist'],
};

export default nextConfig;
