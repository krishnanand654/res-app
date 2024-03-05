import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { useNavigation } from '@react-navigation/native';
const db = SQLite.openDatabase('userdb.db');
import AsyncStorage from '@react-native-async-storage/async-storage';
const Home = () => {
    const navigation = useNavigation();
    const [username, setUsername] = useState('');

    useEffect(() => {
        // Fetch user's name from SQLite database
        db.transaction((tx) => {
            tx.executeSql(
                'SELECT username FROM users;',
                [],
                (_, { rows }) => {
                    if (rows.length > 0) {
                        setUsername(rows.item(0).username);
                        AsyncStorage.setItem('username', rows.item(0).username).then(() => {
                            console.log('userset');
                        }).catch((error) => {
                            console.error('Error setting setup complete flag:', error);
                        });
                    }
                },
                (_, error) => {
                    console.error('Error fetching username:', error);
                }
            );
        });
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.username}>Registered User: {username}</Text>
            <Pressable onPress={() => { navigation.navigate('chat') }}><Text>Chats</Text></Pressable>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    username: {
        fontSize: 20,
    },
});

export default Home;
