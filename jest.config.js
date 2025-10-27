module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["./lib", "./app", "./tests"],
  testMatch: [
    "**/__tests__/**/*.ts",
    "**/?(*.)+(spec|test).ts",
    "**/tests/**/?(*.)+(spec|test).ts",
  ],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: ["**/*.ts", "!**/*.d.ts", "!**/node_modules/**"],
  moduleFileExtensions: ["ts", "js", "json"],
  testTimeout: 120000, // Add this line - 120 seconds
};
