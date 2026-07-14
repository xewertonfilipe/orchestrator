module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(j|t)sx?$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(css|html)$": "<rootDir>/test/fileMock.js",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,js}",
    "webpack.config.js",
    "!src/**/*.d.ts",
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 50,
      functions: 80,
      lines: 80,
    },
  },
};
