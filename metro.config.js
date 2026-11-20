// https://docs.expo.dev/versions/latest/sdk/sqlite/#web-setup
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// expo-sqlite on web (browser preview) loads wa-sqlite as a .wasm asset
config.resolver.assetExts.push('wasm')

// SharedArrayBuffer for expo-sqlite web needs cross-origin isolation
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  middleware(req, res, next)
}

module.exports = config
