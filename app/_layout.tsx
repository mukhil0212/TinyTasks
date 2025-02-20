import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts} from "expo-font";

export default function RootLayout() {
  const [fontsLoaded] = useFonts( {
      "Rubik-Bold": require('../assets/fonts/Rubik-Bold.ttf'),
      "Rubik-ExtraBold": require('../assets/fonts/Rubik-ExtraBold.ttf'),
      "Rubik-Light": require('../assets/fonts/Rubik-Light.ttf'),
      "Rubik-Medium": require('../assets/fonts/Rubik-Medium.ttf'),
      "Rubik-Regular": require('../assets/fonts/Rubik-Regular.ttf'),
      "Rubik-SemiBold": require('../assets/fonts/Rubik-SemiBold.ttf')
  })
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
