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
import { Button } from 'react-native';
import { Map } from './Screens/Map';
import { RootSiblingParent } from 'react-native-root-siblings';

const Stack = createNativeStackNavigator();
export default function App() {

  const handleClearMessage = async () => {



    const url = `http://10.10.10.1/clear`;

    try {
      await fetch(url, {
        method: 'POST'
      });
      console.log("cleared")

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='home'>

        <Stack.Screen name="setup" component={UserSetupScreen} />
        <Stack.Screen name="login" component={Login} />
        <Stack.Screen name="home" component={Home} />
        <Stack.Screen name="map" component={Map} />
        <Stack.Screen name="chat" component={ChatScreen} options={{
          headerTitle: "demo",
          headerRight: () => (
            <Button
              onPress={handleClearMessage}
              title="Clear"
              color="red"
            />)
        }} />

      </Stack.Navigator>
    </NavigationContainer >
  );
}


