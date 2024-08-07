import type { Config } from "jest";

const config: Config = {
    preset: "jest-expo",
    transformIgnorePatterns: [
        "/node_modules/(?!((jest-)?react-native|@firebase/.*|firebase/.*|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@react-native-async-storage/async-storage|whatwg-fetch)",
    ],
    setupFiles: ["./src/__mocks__/index.ts"],
    testEnvironment: "node",
    coveragePathIgnorePatterns: [
        "<rootDir>/src/config/"
    ],
    moduleFileExtensions: ["js", "mjs", "cjs", "jsx", "ts", "tsx", "json", "node", "d.ts"],
};

export default config;
