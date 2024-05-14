import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RootSiblingParent } from 'react-native-root-siblings';
import { View, Pressable, Text, TextInput, StyleSheet, TouchableOpacity, Image } from 'react-native'; // Import Image from react-native
import * as SQLite from 'expo-sqlite';
import { useIsFocused } from '@react-navigation/native';
import { useEffect } from 'react';
import { Button } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-root-toast';
import { StatusBar } from 'react-native';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SetAngle from './SetAngle';
import EditDetailsScreen from './EditUserInfo';
import Dialog from "react-native-dialog";

const fontWeight = Platform.OS === 'ios' ? '400' : '400';
const db = SQLite.openDatabase('userdb.db');

const SettingsScreen = () => {
    const [username, setUsername] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");
    const [editedUsername, setEditedUsername] = useState("");
    const [editedAddress, setEditedAddress] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [visible, setVisible] = useState(false);
    const [visibleUnload, setVisibleUnload] = useState(false);
    const [adminStatus, setAdminStatus] = useState(false);

    const isFocused = useIsFocused();
    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Settings',
            headerStyle: {
                backgroundColor: '#FFFFFF',
            },
            headerTintColor: '#000000',
            headerTitleStyle: {
                fontWeight: 'bold',
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



    const deleteDatabase = async () => {
        // Hide the dialog before proceeding with database deletion


        try {
            // Clear AsyncStorage
            await AsyncStorage.clear();

            // Get the path of the SQLite database file
            const dbPath = `${FileSystem.documentDirectory}SQLite/userdb.db`;

            // Check if the database file exists
            const fileInfo = await FileSystem.getInfoAsync(dbPath);
            if (fileInfo.exists) {
                // Delete the database file
                await FileSystem.deleteAsync(dbPath);
                console.log('SQLite database deleted successfully.');

                // Replace the current screen with the 'setup' screen after a delay
                setTimeout(function hideToast() {
                    setVisible(false);
                    navigation.replace('setup');
                }, 200);
            } else {
                console.log('SQLite database does not exist.');
            }
        } catch (error) {
            // Log any errors encountered during database deletion
            console.error('Error deleting SQLite database:', error);
        }
    };


    useEffect(() => {
        const checkAdmin = async () => {
            const isAdminResult = await isAdmin();
            setAdminStatus(isAdminResult);
        };

        checkAdmin();
    }, []);

    const isAdmin = async () => {
        try {
            const value = await AsyncStorage.getItem('admin');
            return value === 'true'; // Check if the value is 'true' (case-sensitive)
        } catch (error) {
            console.error('Error retrieving admin flag:', error);
            return false; // Assume not admin if there's an error
        }
    };


    const handleClearMessage = async () => {



        const url = `http://10.10.10.1/clear`;

        try {
            await fetch(url, {
                method: 'POST'
            });
            console.log("cleared")

            Toast.show("Server Unloaded", {
                duration: Toast.durations.SHORT,
            });


        } catch (error) {
            console.error('Error sending message:', error);
        }
        setVisibleUnload(false);


    };



    const showDialog = () => {
        setVisible(true);

    };

    const handleOk = () => {


        deleteDatabase();


    }

    const showAlertBox = () => {
        setVisibleUnload(true);
    }

    const handleCancel = () => {
        setVisible(false);
        setVisibleUnload(false);
    };




    return (
        <RootSiblingParent>
            <View style={styles.container}>

                <Dialog.Container visible={visible}>
                    <Dialog.Title>Account delete</Dialog.Title>
                    <Dialog.Description>
                        Do you want to delete this account? You cannot undo this action.
                    </Dialog.Description>
                    <Dialog.Button label="Cancel" onPress={handleCancel} />
                    <Dialog.Button label="Delete" onPress={handleOk} />
                </Dialog.Container>

                <Dialog.Container visible={visibleUnload}>
                    <Dialog.Title>Unload Server</Dialog.Title>
                    <Dialog.Description>
                        Unloading server will remove all the messages and users from the server
                    </Dialog.Description>
                    <Dialog.Button label="Cancel" onPress={handleCancel} />
                    <Dialog.Button label="Unload" onPress={handleClearMessage} />
                </Dialog.Container>

                {/* <View style={styles.imageCtn}>
                    <Image
                        style={styles.image} // Add style to Image component
                        source={require('../assets/user.png')} // Ensure the path is correct
                        accessibilityLabel="reload"
                    />
                </View>
                 */}
                <TouchableOpacity style={styles.userCard} onPress={() => navigation.navigate('edituser')}>
                    <View style={styles.userCardFlex}>
                        <View style={styles.avatarCtn}>
                            <Text style={styles.avatar}>{username.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View>
                            <Text style={styles.userName}>{username}</Text>
                            <Text>Edit Profile</Text>
                        </View>
                    </View>

                </TouchableOpacity>

                {adminStatus ? <>
                    <TouchableOpacity style={styles.userOptions} onPress={() => navigation.navigate('angle')}>
                        <View style={styles.adjBtn}>
                            <Text style={styles.text}>Adjust Panel</Text>
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.caption}>Adjust the solar panel position manually with the help of slider. This action is restricted to <Text style={styles.span}>ResNet admins</Text></Text>

                    <View style={styles.userOptions}>
                        <TouchableOpacity style={styles.userOptions} onPress={showAlertBox}>
                            <View style={styles.adjBtn}>
                                <Text style={styles.text}>Unload Server</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.caption}>Clear all messages and associated data to enhance server performance and efficiency. This action is restricted to <Text style={styles.span}>ResNet admins</Text>
                    </Text>
                </> : null}
                <View style={styles.userOptions}>
                    <Button onPress={deleteDatabase} >
                        <Text style={styles.delText}>Delete Account</Text>
                    </Button>
                </View>
                <Text style={styles.caption}>Caution: Deleting the account will result in the loss of access to critical communication during emergencies. The application is authorized to ensure network availability in such situations. Re-establishing your account after deletion is essential to maintain communication capabilities.
                </Text>
                {/* {phoneNumber === "9495434706" ?
                    <>
                        <Button onPress={() => { navigation.navigate('angle') }}>
                            <Text style={styles.text}>Adjust Panel</Text>
                        </Button>
                        <Button onPress={handleClearMessage}>
                            <Text style={styles.text}>Unload Server</Text>
                        </Button>
                    </>
                    : null}

                <Button onPress={deleteDatabase}>
                    <Text style={styles.delText}>Delete Account</Text>
                </Button>
 */}

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
    userCard: {
        backgroundColor: 'white',
        width: '100%',
        borderRadius: 10,
        padding: 10,
        marginBottom: 20,
    },
    userCardFlex: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    span: {
        color: '#007AFF'
    },
    adjBtn: {
        padding: 10
    },
    userOptions: {
        backgroundColor: 'white',
        width: '100%',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    caption: {
        color: '#6D6D6D',
        marginTop: 10,
        marginBottom: 24
    },
    userName: { fontSize: 22, marginBottom: 5 },
    avatarCtn: {
        backgroundColor: '#A1A1A1',
        borderRadius: 100,
        width: 60,
        height: 60,
        marginRight: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    avatar: {
        color: 'white',
        fontWeight: '600',
        fontSize: 24
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