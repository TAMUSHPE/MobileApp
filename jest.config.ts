import type { Config } from "jest";

const config: Config = {
    preset: "jest-expo",
    transformIgnorePatterns: [
        "/node_modules/(?!((jest-)?react-native|@firebase/.*|firebase/.*|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)",
    ],
    coverageDirectory: "../coverage",
};

export default config;
