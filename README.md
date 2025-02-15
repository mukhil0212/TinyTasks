# TinyTasks

A React Native Expo application with Supabase authentication and NativeWind (Tailwind CSS) styling.

## Tech Stack

- [React Native](https://reactnative.dev/) - Mobile application framework
- [Expo](https://expo.dev) - Development platform
- [Supabase](https://supabase.com/) - Backend and Authentication
- [NativeWind](https://www.nativewind.dev/) - Tailwind CSS for React Native
- [Expo Router](https://docs.expo.dev/router/introduction/) - File-based routing

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or newer)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/client) app on your mobile device (for testing)
- [VSCode](https://code.visualstudio.com/) with recommended extensions:
  - Tailwind CSS IntelliSense
  - ESLint
  - Prettier

## Environment Setup

1. Create a `.env` file in the root directory with your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mukhil0212/TinyTasks.git
   cd TinyTasks
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Run the app:
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Press 'i' to open in iOS simulator
   - Press 'a' to open in Android emulator
   - Press 'w' to open in web browser

## Project Structure

```
TinyTasks/
├── app/                    # Expo Router pages
├── components/            # Reusable components
├── lib/                   # Utility functions and configurations
├── supabase/             # Supabase configurations and migrations
└── ...configuration files
```

## Key Dependencies

### Core
- `expo`: ~50.0.4
- `react`: 18.2.0
- `react-native`: 0.73.2
- `expo-router`: ^3.4.6

### Styling
- `nativewind`: ^2.0.11
- `tailwindcss`: ^3.3.2

### Authentication & Backend
- `@supabase/supabase-js`: ^2.39.3

### Development
- `typescript`: ^5.1.3
- `expo-dev-client`: ~3.3.7

## Features

- 🔐 Supabase Authentication
  - Email/Password Sign Up
  - Email/Password Sign In
  - Session Management

- 💅 Styling
  - Tailwind CSS support via NativeWind
  - Modern and responsive UI
  - Dark/Light mode support

- 🛠 Development
  - TypeScript support
  - ESLint configuration
  - Prettier formatting
  - VSCode configuration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
