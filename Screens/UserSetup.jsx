import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
const db = SQLite.openDatabase('userdb.db');

const UserSetupScreen = () => {
    const navigation = useNavigation();
    const [username, setUsername] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');

    const handleSaveUser = () => {
        if (username.trim() === '' || phoneNumber.trim() === '' || address.trim() === '') {
            alert('Please fill in all fields.');
            return;
        }

        db.transaction(
            (tx) => {
                tx.executeSql(
                    'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, phoneNumber TEXT, address TEXT);'
                );
                tx.executeSql(
                    'INSERT INTO users (username, phoneNumber, address) VALUES (?, ?, ?);',
                    [username, phoneNumber, address],
                    (_, { rowsAffected }) => {
                        if (rowsAffected > 0) {
                            AsyncStorage.setItem('setupComplete', 'true').then(() => {
                                console.log('Setup complete flag set.');
                            }).catch((error) => {
                                console.error('Error setting setup complete flag:', error);
                            });
                            alert('User saved successfully!');
                            navigation.navigate('home');
                            setUsername('');
                            setPhoneNumber('');
                            setAddress('');
                        } else {
                            alert('Failed to save user.');
                        }
                    }
                );
            },
            (error) => {
                console.error(error);
            }
        );
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={(text) => setUsername(text)}
            />
            <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(text)}
                keyboardType="phone-pad"
            />
            <TextInput
                style={styles.input}
                placeholder="Address"
                value={address}
                onChangeText={(text) => setAddress(text)}
            />
            <Button title="Save" onPress={handleSaveUser} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    input: {
        width: '100%',
        marginBottom: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
    },
});

export default UserSetupScreen;
