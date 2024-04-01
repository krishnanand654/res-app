import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RootSiblingParent } from 'react-native-root-siblings';
import { View, Pressable, Text, TextInput, StyleSheet, Image } from 'react-native'; // Import Image from react-native
import * as SQLite from 'expo-sqlite';
import { useIsFocused } from '@react-navigation/native';
import { useEffect } from 'react';
import { Button } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-root-toast';
import { StatusBar } from 'react-native';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const fontWeight = Platform.OS === 'ios' ? '400' : '400';
const db = SQLite.openDatabase('userdb.db');

const SettingsScreen = () => {
    const [username, setUsername] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");
    const [editedUsername, setEditedUsername] = useState("");
    const [editedAddress, setEditedAddress] = useState("");
    const [editMode, setEditMode] = useState(false);

    const isFocused = useIsFocused();
    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Settings',
            headerStyle: {
                backgroundColor: '#FFFFFF', // Change this to the desired color
            },
            headerTintColor: '#000000', // Change text color
            headerTitleStyle: {
                fontWeight: 'bold', // Style the text of the header title
            },
        });

        // Set status bar style
        StatusBar.setBarStyle('dark-content'); // Set status bar content to dark color
    }, []);


    useEffect(() => {
        if (isFocused) {
            db.transaction((tx) => {
                tx.executeSql(
                    'SELECT * FROM users;',
                    [],
                    (_, { rows }) => {
                        if (rows.length > 0) {
                            setUsername(rows.item(0).username);
                            setPhoneNumber(rows.item(0).phoneNumber);
                            setAddress(rows.item(0).address);
                            setEditedUsername(rows.item(0).username);
                            setEditedAddress(rows.item(0).address);
                        }
                    },
                    (_, error) => {
                        navigation.replace('setup');
                    }
                );
            });
        }
    }, [isFocused]);

    const handleSaveChanges = () => {
        // Update the database with the edited values
        db.transaction((tx) => {
            tx.executeSql(
                'UPDATE users SET username = ?, address = ? WHERE id = 1;',
                [editedUsername, editedAddress],
                () => {
                    console.log('Data updated successfully.');
                    setUsername(editedUsername);
                    setAddress(editedAddress);
                    setEditMode(false);
                },
                (_, error) => {
                    console.error('Error updating data:', error);
                    // Optionally, you can show an error message here
                }
            );
        });
    };

    const deleteDatabase = async () => {
        try {
            // Close the database connection
            // db._db.close();
            await AsyncStorage.clear();

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


    const toggleEditMode = () => {
        setEditMode(!editMode);
    };

    return (
        <RootSiblingParent>
            <View style={styles.container}>

                <View style={styles.imageCtn}>
                    <Image
                        style={styles.image} // Add style to Image component
                        source={require('../assets/user.png')} // Ensure the path is correct
                        accessibilityLabel="reload"
                    />
                </View>
                <View style={styles.card}>
                    {editMode ? (
                        <TextInput
                            style={styles.input}
                            value={editedUsername}
                            onChangeText={setEditedUsername}
                        />
                    ) : (
                        <Text style={styles.name}>{username}</Text>
                    )}
                    <Text>{phoneNumber}</Text>

                    {editMode ? (
                        <TextInput
                            style={styles.input}
                            value={editedAddress}
                            onChangeText={setEditedAddress}
                        />
                    ) : (
                        <Text>{address}</Text>
                    )}
                </View>

                {editMode ? (
                    <Button style={styles.editButton} onPress={handleSaveChanges}>
                        <Text style={styles.text}>Save Changes</Text>
                    </Button>
                ) : (
                    <Button style={styles.editButton} onPress={toggleEditMode}>
                        <Text style={styles.text}>Edit</Text>
                    </Button>
                )}

                <Button onPress={deleteDatabase}>
                    <Text style={styles.delText}>Delete Account</Text>
                </Button>
            </View>

        </RootSiblingParent>
    );
};

export default SettingsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    image: {
        width: 100, // Set width
        height: 100, // Set height
        marginBottom: 20, // Add margin bottom
    },
    editButton: {
        backgroundColor: 'white',
        color: '#ffffff',
        borderRadius: 10,
        width: '100%'
    },
    delButton: {
        backgroundColor: 'red',
        color: '#ffffff',
        borderRadius: 50,
    },
    text: {
        color: '#007AFF',
        fontWeight: fontWeight,
        fontSize: 16
    },
    delText: {
        color: 'red',
        fontWeight: fontWeight,
        fontSize: 16
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        marginTop: 10,
        paddingHorizontal: 10,
        borderRadius: 10,

        width: 250
    },
    name: {
        fontSize: 28,
        textAlign: 'center'
    },
    image: {
        width: 300,
        height: 250,
        marginRight: 20,
        marginTop: 30
    },

    card: {
        width: 250,
        alignItems: 'center',
        marginTop: -50,
        marginBottom: 80

    }
});
