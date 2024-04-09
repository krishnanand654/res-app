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
import { Button, Platform } from 'react-native';
import { Map } from './Screens/Map';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { TouchableOpacity, View, Text } from 'react-native';
import SettingsScreen from './Screens/SettingsScreen';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import setAngle from './Screens/SetAngle';
import EditDetailsScreen from './Screens/EditUserInfo';
import { FileSystem } from 'expo';


const Stack = createNativeStackNavigator();
export default function App() {


  async function prefetchAssets() {
    // Define the directory where your assets are located
    const assetsDirectory = FileSystem.documentDirectory + 'assets/';

    try {
      // Get a list of all files in the assets directory
      const files = await FileSystem.readDirectoryAsync(assetsDirectory);

      // Iterate over each file
      for (const file of files) {
        // Prefetch the asset using Image.prefetch
        const assetUri = assetsDirectory + file;
        await Image.prefetch(assetUri);
        console.log(`Prefetched asset: ${assetUri}`);
      }

      console.log('All assets preloaded successfully!');
    } catch (error) {
      console.error('Error prefetching assets:', error);
    }
  }

  // Call the prefetchAssets function when your app initializes
  useEffect(() => { prefetchAssets })

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>

        <NavigationContainer>
          <Stack.Navigator initialRouteName='home'>
            <Stack.Screen name="setup" component={UserSetupScreen} />
            <Stack.Screen name="login" component={Login} />
            <Stack.Screen name="home" component={Home} options={{ headerShown: false, headerTintColor: 'blue' }} />
            <Stack.Screen name="setting" component={SettingsScreen} />
            <Stack.Screen name="map" component={Map} />
            <Stack.Screen name="angle" component={setAngle} />
            <Stack.Screen name="edituser" component={EditDetailsScreen} />

            <Stack.Screen
              name="chat"
              component={ChatScreen}
              options={{
                headerTitle: "chat",
                // headerRight: () => (
                //   <TouchableOpacity onPress={handleClearMessage}>
                //     <View style={styles.buttonContainer}>
                //       <Text style={[styles.buttonText, { fontSize: Platform.OS === 'ios' ? 16 : 14 }]}>Clear chat</Text>
                //     </View>
                //   </TouchableOpacity>
                // )
              }}
            />

          </Stack.Navigator>
        </NavigationContainer>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({

  buttonText: {
    color: 'red',
  },
});
