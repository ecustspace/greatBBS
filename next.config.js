/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['antd-mobile'],
    experimental: {
        serverActions: true,
    }
}

module.exports = nextConfig

