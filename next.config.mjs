/** @type {import('next').NextConfig} */
const FALLBACK_DATABASE_URL =
  "postgresql://neondb_owner:npg_CKrstL95iQhV@ep-still-mountain-bez1bkab-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15&connection_limit=5&pool_timeout=20";
const FALLBACK_DIRECT_URL =
  "postgresql://neondb_owner:npg_CKrstL95iQhV@ep-still-mountain-bez1bkab.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=15";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = FALLBACK_DATABASE_URL;
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = FALLBACK_DIRECT_URL;
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL || FALLBACK_DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL || FALLBACK_DIRECT_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "cashbook-secret-jwt-key-32-chars-long",
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
