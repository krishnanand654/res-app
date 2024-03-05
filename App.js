// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './Screens/Login';
import UserSetupScreen from './Screens/UserSetup';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Home from './Screens/Home';
import ChatScreen from './Screens/Chat';

const Stack = createNativeStackNavigator();
export default function App() {
  const [setupCompleted, setSetupCompleted] = useState(true);

  useEffect(() => {
    // Check if the setup is completed
    AsyncStorage.getItem('setupCompleted').then((value) => {
      if (value === 'true') {
        setSetupCompleted(true);
      }
    });
  }, []);
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={setupCompleted ? 'home' : 'setup'}>
        <Stack.Screen name="setup" component={UserSetupScreen} />
        <Stack.Screen name="login" component={Login} />
        <Stack.Screen name="home" component={Home} />
        <Stack.Screen name="chat" component={ChatScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}


