const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add explicit module resolution for packages with complex exports
const nodeModulesPath = path.resolve(__dirname, "node_modules");

config.resolver = {
  ...config.resolver,
  // Don't transform .mjs files to avoid import.meta issues - restore .mjs for WalletConnect
  sourceExts: [...(config.resolver?.sourceExts || ['js', 'jsx', 'json', 'ts', 'tsx']), 'cjs', 'mjs'],
  // Extra node modules resolution
  extraNodeModules: {
    ...config.resolver?.extraNodeModules,
    '@walletconnect/ethereum-provider': path.resolve(nodeModulesPath, '@walletconnect/ethereum-provider'),
    'events': path.resolve(nodeModulesPath, 'events'),
  },
  // Resolve these extensions in order
  resolverMainFields: ['react-native', 'browser', 'main', 'module'],
  // Unstable settings for better package resolution
  unstable_enablePackageExports: true,
  unstable_conditionNames: ['require', 'react-native', 'default'],
};

// Ensure watchFolders includes node_modules for proper resolution
config.watchFolders = [
  ...(config.watchFolders || []),
  nodeModulesPath,
];

module.exports = withNativeWind(config, { input: "./global.css" });

