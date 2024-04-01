import React from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { useIsFocused } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChatListScreen from './ChatlistScreen';
import SettingsScreen from './SettingsScreen';

import { Ionicons } from '@expo/vector-icons';
const Tab = createBottomTabNavigator();
const db = SQLite.openDatabase('userdb.db');

const height = Platform.OS === 'ios' ? 100 : 67;

export default function Home() {

    const navigation = useNavigation();
    const isFocused = useIsFocused(); // returns true if the screen is focused

    const [username, setUsername] = useState('');

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'ResNet', // Set the header title here
        });
    }, []);

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
                                // Toast.show(rows.item(0).username, {
                                //     duration: Toast.durations.LONG,
                                // });
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
    }, [isFocused,]);


    return (
        <Tab.Navigator

            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'ResNet') {
                        iconName = focused
                            ? 'chatbubble-ellipses'
                            : 'chatbubble-ellipses-outline';
                    } else if (route.name === 'Settings') {
                        iconName = focused ? 'cog' : 'cog-outline';
                    }

                    // You can return any component that you like here!
                    return <Ionicons name={iconName} color="black" size={24} height={40} />;
                },

                tabBarActiveTintColor: 'black',
                tabBarInactiveTintColor: 'gray',
                tabBarLabelStyle: {
                    fontSize: 14,
                    paddingBottom: 10,
                },
                tabBarStyle: { backgroundColor: 'white', paddingTop: 20, height: height },
            })}
        >
            <Tab.Screen
                name="ResNet"
                component={ChatListScreen}
                initialParams={{ phone: username }}
                options={{
                    tabBarLabel: 'Chat',

                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarLabel: 'Settings',
                }}
            />
        </Tab.Navigator>

    );
}



