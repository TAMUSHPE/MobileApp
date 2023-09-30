import type { Config } from "jest";

const config: Config = {
    preset: "jest-expo",
    transform: {
        "^.+\\.js$": "babel-jest",
        "^.+\\.ts$": "ts-jest"
    },
    transformIgnorePatterns: [
        "/node_modules/(?!((jest-)?react-native|@firebase/.*|firebase/.*|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@react-native-async-storage/async-storage|node-fetch)",
    ],
    setupFiles: ["./src/__mocks__/index.ts"],
    globals: {
        "fetch": global.fetch,
    }
};

export default config;
