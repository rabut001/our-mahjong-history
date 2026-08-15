import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // リポジトリ直下の AGENTS.md を正とするため、Next.js による自動生成はしない
  agentRules: false,
};

export default nextConfig;
