import React from 'react';
import { Platform, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1 }}>
        <AppNavigator />
      </View>
    );
  }

  const { GestureHandlerRootView } = require('react-native-gesture-handler');
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
}
