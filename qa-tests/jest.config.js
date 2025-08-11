/**
 * Jest Configuration for MedCor Healthcare Platform
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Root directories
  roots: ['<rootDir>/frontend', '<rootDir>/integration'],
  
  // Module paths
  modulePaths: ['<rootDir>'],
  moduleDirectories: ['node_modules', 'src'],
  
  // File extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-react'
      ]
    }]
  },
  
  // Path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../client/src/$1',
    '^@components/(.*)$': '<rootDir>/../client/src/components/$1',
    '^@pages/(.*)$': '<rootDir>/../client/src/pages/$1',
    '^@hooks/(.*)$': '<rootDir>/../client/src/hooks/$1',
    '^@services/(.*)$': '<rootDir>/../client/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/../client/src/utils/$1',
    '^@lib/(.*)$': '<rootDir>/../client/src/lib/$1',
    '^@assets/(.*)$': '<rootDir>/../attached_assets/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/mocks/fileMock.js'
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
  
  // Test patterns
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    '../client/src/**/*.{ts,tsx}',
    '!../client/src/**/*.d.ts',
    '!../client/src/main.tsx',
    '!../client/src/vite-env.d.ts',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.cache/',
    '/dist/',
    '/build/'
  ],
  
  // Timeout
  testTimeout: 30000,
  
  // Globals
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Verbose output
  verbose: true
};