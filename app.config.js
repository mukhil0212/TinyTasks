module.exports = {
  extra: {
    'eas': {
      'projectId': 'your-project-id'
    },
    'EXPO_PUBLIC_GROQ_API_KEY': process.env.EXPO_PUBLIC_GROQ_API_KEY || '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', // Replace with your actual Groq API key
  },
  expo: {
    experiments: {
      tsconfigPaths: true,
      newArchEnabled: true
    },
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
      [
        'expo-notifications',
        {
          icon: './assets/icons/notification-icon.png',
          color: '#7C3AED'
        }
      ],
      'expo-router'
    ],
    scheme: 'tinytasks'
  }
};
