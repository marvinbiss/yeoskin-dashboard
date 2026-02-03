/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@upstash/redis$': '<rootDir>/__mocks__/@upstash/redis.js',
    '^@upstash/ratelimit$': '<rootDir>/__mocks__/@upstash/ratelimit.js',
    '^@supabase/supabase-js$': '<rootDir>/__mocks__/@supabase/supabase-js.js',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(uncrypto)/)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
    '^.+\\.(js|jsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        allowJs: true,
      },
    }],
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  testMatch: [
    '**/__tests__/**/*.(spec|test).[jt]s?(x)',
    '**/*.(spec|test).[jt]s?(x)',
  ],
}

module.exports = config
