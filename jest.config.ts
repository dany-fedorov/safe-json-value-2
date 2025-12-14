import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  transform: {
    '^.+\\.(ts|js)?$': 'ts-jest',
  },
  testRegex: '/(tests|src)/.*.test(\\..+)?\\.(ts|js)$',
  collectCoverageFrom: ['src/**/*.(ts|js)'],
  coverageReporters: ['json-summary', 'text', 'lcov'],
};

export default config;
