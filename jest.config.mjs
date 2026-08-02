import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config = {
  clearMocks: true,
  collectCoverageFrom: ["app/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "!app/**/layout.tsx"],
  modulePathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  setupFilesAfterEnv: [],
  testEnvironment: "jsdom",
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
};

export default createJestConfig(config);
