/** @type {import('next').NextConfig} */
const nextConfig: import('next').NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb' // Allow larger files (adjust as needed)
    }
  },
 
};

export default nextConfig;

