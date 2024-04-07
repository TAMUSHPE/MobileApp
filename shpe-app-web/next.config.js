/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['lh3.googleusercontent.com' ,'firebasestorage.googleapis.com'],
    },
      webpack(config) {
          config.module.rules.push({
            test: /.svg$/,
            use: ['@svgr/webpack'],
          });
          return config;
        },
   }
   
   
   module.exports = nextConfig