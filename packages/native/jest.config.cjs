/* eslint-disable @typescript-eslint/no-require-imports */
// Jest for @the-system/native: the React Native testing library on the
// jest-expo preset.
//
// React: the repo root holds react 19.3.1 for the web packages. React Native
// 0.88 needs the exact react its renderer was built with (19.3.0), which npm
// keeps in this package's own node_modules. Every import of react, from any
// file (react-native included), is mapped to that copy, so one React runs.
const path = require('node:path');

const react = path.dirname(require.resolve('react/package.json', { paths: [__dirname] }));

module.exports = {
  preset: 'jest-expo/ios',
  rootDir: __dirname,
  roots: ['<rootDir>/src'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  // Reanimated 4 and Worklets run their JS implementation under jest through this resolver.
  resolver: require.resolve('react-native-reanimated/jest/resolver', { paths: [__dirname] }),
  moduleNameMapper: {
    '^react$': react,
    '^react/(.*)$': `${react}/$1`,
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|react-native-svg|react-native-reanimated|react-native-worklets|@rn-primitives/.*))',
  ],
  cacheDirectory: path.join(__dirname, 'node_modules/.cache/jest'),
};
