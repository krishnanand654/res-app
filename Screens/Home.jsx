import React from 'react';
import { View, StyleSheet, Pressable, ToastAndroid } from 'react-native';

import { CommonActions, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, BottomNavigation } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { useIsFocused } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { RootSiblingParent } from 'react-native-root-siblings';
import Toast from 'react-native-root-toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChatListScreen from './ChatlistScreen';
import WebSocketScreen from './WebSocketScreen';

const Tab = createBottomTabNavigator();
const db = SQLite.openDatabase('userdb.db');



export default function Home() {


    const navigation = useNavigation();
    const isFocused = useIsFocused(); // returns true if the screen is focused

    const [username, setUsername] = useState('');

    useEffect(() => {
        if (isFocused) {
            // Fetch user's name from SQLite database
            db.transaction((tx) => {
                tx.executeSql(
                    'SELECT * FROM users;',
                    [],
                    (_, { rows }) => {
                        if (rows.length > 0) {
                            console.log(rows);
                            setUsername(rows.item(0).username);
                            AsyncStorage.setItem('username', rows.item(0).username).then(() => {
                                Toast.show(rows.item(0).username, {
                                    duration: Toast.durations.LONG,
                                });
                                console.log('userset');
                            }).catch((error) => {
                                console.error('Error setting setup complete flag:', error);
                            });



                            AsyncStorage.setItem('phone', rows.item(0).phoneNumber).then(() => {
                                console.log('phoneSet');
                            }).catch((error) => {
                                console.error('Error setting setup complete flag:', error);
                            });

                        }
                    },
                    (_, error) => {
                        navigation.replace('setup');
                        // console.error('Error fetching username:', error);
                    }
                );
            });
        }
    }, [isFocused]);


    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
            }}
            tabBar={({ navigation, state, descriptors, insets }) => (
                <BottomNavigation.Bar
                    navigationState={state}
                    safeAreaInsets={insets}
                    onTabPress={({ route, preventDefault }) => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (event.defaultPrevented) {
                            preventDefault();
                        } else {
                            navigation.dispatch({
                                ...CommonActions.navigate(route.name, route.params),
                                target: state.key,
                            });
                        }
                    }}
                    renderIcon={({ route, focused, color }) => {
                        const { options } = descriptors[route.key];
                        if (options.tabBarIcon) {
                            return options.tabBarIcon({ focused, color, size: 24 });
                        }

                        return null;
                    }}
                    getLabelText={({ route }) => {
                        const { options } = descriptors[route.key];
                        const label =
                            options.tabBarLabel !== undefined
                                ? options.tabBarLabel
                                : options.title !== undefined
                                    ? options.title
                                    : route.title;

                        return label;
                    }}
                />
            )}
        >

            <Tab.Screen
                name="Home"
                component={ChatListScreen}
                // component={WebSocketScreen}
                initialParams={{ phone: username }}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => {
                        return <Icon name="home" size={size} color={color} />;
                    },
                }}
            />

            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarLabel: 'Settings',
                    tabBarIcon: ({ color, size }) => {
                        return <Icon name="cog" size={size} color={color} />;
                    },
                }}
            />
        </Tab.Navigator>
    );
}

// function HomeScreen() {
//     const navigation = useNavigation();
//     console.log(phoneNumber);
//     return (
//         <ChatListScreen customProps={phoneNumber} />
//     );
// }

function SettingsScreen() {
    const navigation = useNavigation();
    const deleteDatabase = async () => {
        try {
            // Close the database connection
            db._db.close();

            // Get the path of the SQLite database file
            const dbPath = `${FileSystem.documentDirectory}SQLite/userdb.db`;

            // Check if the database file exists
            const fileInfo = await FileSystem.getInfoAsync(dbPath);
            if (fileInfo.exists) {
                // Delete the database file
                await FileSystem.deleteAsync(dbPath);
                console.log('SQLite database deleted successfully.');
                let toast = Toast.show('Deleted successfully', {
                    duration: Toast.durations.LONG,
                });

                setTimeout(function hideToast() {
                    navigation.replace('setup')
                }, 200)

            } else {
                console.log('SQLite database does not exist.');
            }
        } catch (error) {
            console.error('Error deleting SQLite database:', error);
        }
    };

    return (
        <RootSiblingParent>
            <View style={styles.container}>
                <Pressable onPress={deleteDatabase}><Text>Delete account</Text></Pressable>

            </View>
        </RootSiblingParent>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%'
    },
});