import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFonts, Fraunces_500Medium_Italic, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Karla_400Regular, Karla_600SemiBold, Karla_700Bold } from '@expo-google-fonts/karla';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_500Medium_Italic,
    Karla_400Regular,
    Karla_600SemiBold,
    Karla_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <AppNavigator />
    </View>
  );
}
