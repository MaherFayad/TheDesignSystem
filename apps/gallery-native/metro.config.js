/* eslint-disable @typescript-eslint/no-require-imports */
// Metro for the native gallery inside the npm workspace.
//
// - watchFolders: the repo root, so the packages the gallery imports
//   (packages/native, tokens, styles, icons, shared) are bundled from source.
// - nodeModulesPaths: this app's node_modules first, then the root's.
// - One React: the root holds react and react-dom 19.3.1 for the web
//   packages, React Native 0.88 needs the exact 19.3.0 its renderer was built
//   with, and npm keeps that copy here (and in packages/native for its tests).
//   Every import of react or react-dom, from any file, resolves from this app.
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules'), path.resolve(workspaceRoot, 'node_modules')];

const single = ['react', 'react-dom'];
const origin = path.join(projectRoot, 'index.ts');
const upstream = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = upstream ?? context.resolveRequest;
  if (single.some((name) => moduleName === name || moduleName.startsWith(`${name}/`))) {
    return resolve({ ...context, originModulePath: origin }, moduleName, platform);
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;
