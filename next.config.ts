/** @type {import('next').NextConfig} */
const nextConfig = {
  // Custom server handles everything; disable Next.js standalone server features
  // that conflict with our Socket.IO setup
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
