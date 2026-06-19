const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Exclude .local directory from Metro's file watcher to avoid ENOENT errors
// in Replit environment where .local/skills may have transient paths
config.watchFolders = (config.watchFolders || []).filter(
  (folder) => !folder.includes("/.local/")
);

config.resolver = {
  ...config.resolver,
  blockList: [
    ...(config.resolver?.blockList ? [config.resolver.blockList].flat() : []),
    /\.local\/.*/,
  ],
};

// Watch only project source folders
config.watchFolders = [
  path.resolve(__dirname, "app"),
  path.resolve(__dirname, "components"),
  path.resolve(__dirname, "lib"),
  path.resolve(__dirname, "server"),
  path.resolve(__dirname, "assets"),
  path.resolve(__dirname, "constants"),
  path.resolve(__dirname, "drizzle"),
];

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
