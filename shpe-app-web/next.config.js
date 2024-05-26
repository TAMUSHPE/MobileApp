const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com", "firebasestorage.googleapis.com"],
  },
  webpack(config) {
    // Add SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    // Add path alias
    config.resolve.alias["@mobile"] = path.resolve(
      __dirname,
      "../../MobileApp/src"
    );

    return config;
  },
};

module.exports = nextConfig;
