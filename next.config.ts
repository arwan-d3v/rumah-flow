/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // INI WAJIB ADA UNTUK CLOUDFLARE PAGES
  images: {
    unoptimized: true, // WAJIB ADA agar tag <Image> Next.js tidak error saat diexport
  },
};

export default nextConfig;