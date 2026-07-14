import type { Config } from "jest";

const config: Config = {
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
  transform: { "^.+\\.tsx?$": ["ts-jest", { useESM: true }] },
  testEnvironment: "node",
  setupFiles: ["dotenv/config"],
  clearMocks: true,
};

export default config;
