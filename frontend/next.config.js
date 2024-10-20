/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.springernature.com',
      },
      {
        protocol: 'https',
        hostname: 'ars.els-cdn.com',
      },
      {
        protocol: 'https',
        hostname: 'iopscience.iop.org',
      },
      {
        protocol: 'https',
        hostname: 'www.science.org',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
};

module.exports = nextConfig;
