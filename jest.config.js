module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["./lib", "./app"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: ["**/*.ts", "!**/*.d.ts", "!**/node_modules/**"],
  moduleFileExtensions: ["ts", "js", "json"],
};
