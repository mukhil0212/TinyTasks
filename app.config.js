module.exports = {
  expo: {
    name: 'TinyTasks',
    slug: 'tiny-tasks',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#FFFFFF'
      }
    },
    web: {
      bundler: 'metro'
    },
    plugins: [
      'expo-router',
      'expo-notifications'
    ],
    scheme: 'tinytasks'
  }
};
