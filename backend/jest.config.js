// Jest con TypeScript en modo ESM (el backend usa "type": "module").
/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  extensionsToTreatAsEsm: ['.ts'],
  // Los imports del código llevan extensión .js (NodeNext); Jest resuelve el .ts.
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.test.json' }],
  },
  setupFiles: ['<rootDir>/tests/setup/env.ts'],
  globalSetup: '<rootDir>/tests/setup/global-setup.js',
  testTimeout: 20000,
};
