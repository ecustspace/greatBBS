/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
    dest: 'public'
})

const nextConfig = {
    transpilePackages: ['antd-mobile'],
    experimental: {
        serverActions: true,
    }
}

module.exports = withPWA({
    transpilePackages: ['antd-mobile'],
    experimental: {
        serverActions: true,
    }
})

