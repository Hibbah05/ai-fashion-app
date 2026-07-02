import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  useFonts,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_400Regular_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono';

import LoginScreen   from './screens/LoginScreen';
import HomeScreen    from './screens/HomeScreen';
import ChatScreen    from './screens/ChatScreen';
import WardrobeScreen from './screens/WardrobeScreen';

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Playfair-Bold':    PlayfairDisplay_700Bold,
    'Playfair-Italic':  PlayfairDisplay_400Regular_Italic,
    'SpaceMono-Regular': SpaceMono_400Regular,
    'SpaceMono-Bold':   SpaceMono_700Bold,
  });

  // Font load failed — render app anyway with system fonts so
  // the spinner doesn't freeze forever on web
  if (fontError) {
    console.warn('[Fonts] Failed to load custom fonts:', fontError);
  }

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#D67C8E" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login"    component={LoginScreen}    />
        <Stack.Screen name="Home"     component={HomeScreen}     />
        <Stack.Screen name="Chat"     component={ChatScreen}     />
        <Stack.Screen name="Wardrobe" component={WardrobeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    backgroundColor: '#171214',
    justifyContent: 'center',
    alignItems: 'center',
  },
});