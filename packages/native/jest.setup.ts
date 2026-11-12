/* eslint-disable @typescript-eslint/no-require-imports */
// Reanimated 4 under jest: its JS implementation (through the resolver in
// jest.config.cjs) with the test helpers set up. Animations run on timers.
// jest.mock factories run before imports, so they take require().
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
require('react-native-reanimated').setUpTests();
