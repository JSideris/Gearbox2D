module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/typescript/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
