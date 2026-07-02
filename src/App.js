import React from 'react';
import { SafeAreaView, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts, PlayfairDisplay_700Bold, PlayfairDisplay_400Regular_Italic } from '@expo-google-fonts/playfair-display';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';

// 🏢 Import our core screen modules seamlessly
import LoginScreen from './screens/LoginScreen'; // Added the missing import!
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import WardrobeScreen from './screens/WardrobeScreen';

const Stack = createStackNavigator();

export default function App() {
  let [fontsLoaded] = useFonts({
    'Playfair-Bold': PlayfairDisplay_700Bold,
    'Playfair-Italic': PlayfairDisplay_400Regular_Italic,
    'SpaceMono-Regular': SpaceMono_400Regular,
    'SpaceMono-Bold': SpaceMono_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#2C3527" />
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* 🔑 Moved Login to the top slot so it boots as the initial entry screen */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Wardrobe" component={WardrobeScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingCenter: { flex: 1, backgroundColor: '#CBD5C0', justifyContent: 'center', alignItems: 'center' },
});