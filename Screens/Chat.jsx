import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { View, Text, TextInput, Button, FlatList, StyleSheet, ActivityIndicator, Pressable, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-root-toast';
import { RootSiblingParent } from 'react-native-root-siblings';

const ChatScreen = ({ route }) => {
    const { username, phoneNumber } = route.params;
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [senderName, setSenderName] = useState('');
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [receiver, setReceiver] = useState('');

    const navigation = useNavigation();

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setKeyboardVisible(false);
            }
        );

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    const inputContainerStyle = {
        ...styles.inputContainer,
        height: Platform.select({
            ios: keyboardVisible ? 150 : 80,
            android: keyboardVisible ? 150 : 60,
        }),
    };



    const handleSendLocation = async () => {
        try {
            setLoadingLocation(true);

            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const { coords } = location;

            if (coords) {
                const { longitude, latitude } = coords;
                setLocation({ longitude, latitude });
                setInputMessage(`${latitude},${longitude}`);
                handleSendMessage();
            } else {
                setErrorMsg('Failed to get location coordinates');
            }
        } catch (error) {
            console.error('Error getting location:', error);
        } finally {
            setLoadingLocation(false);
        }
    };

    useEffect(() => {
        retrieveData();
    }, []);

    const retrieveData = async () => {
        try {
            const value = await AsyncStorage.getItem('phone');
            const uservalue = await AsyncStorage.getItem('username');
            if (value !== null) {
                // Trim spaces before and after the name
                const trimmedValue = value.trim();
                const trimmedUserValue = uservalue.trim();
                setSenderName(trimmedValue);
                setReceiver(trimmedUserValue);
            }
        } catch (error) {
            console.error('Error retrieving data:', error);
        }
    };


    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            // const response = await fetch('https://resnet-server.onrender.com/messages');
            const response = await fetch('http://10.10.10.1/messages');
            const data = await response.json();
            // setMessages(data.messages);




            // const localMessages = [
            //     { id: 1, username: 'Kris', message: 'Hello' },
            //     { id: 2, username: 'Krishnanand ', message: 'Hi' },
            //     { id: 3, username: 'Kris', message: 'How are you?' },
            //     { id: 4, username: 'Kris', message: 'How are you?' },
            //     { id: 5, username: 'Krishnanand ', message: 'I"m stuck here please help me please' },
            //     { id: 6, username: 'Krishnanand ', message: '9.459296075730787%2C76.52225665031116' },
            //     { id: 7, username: 'Kris', message: 'Hi Ay' },


            // ];

            const decodedMessages = data.messages.map(msg => ({
                ...msg,
                message: decodeURIComponent(msg.message)
            }));

            console.log(decodedMessages);

            // Set the decoded messages to state
            setMessages(decodedMessages);

            // setMessages(localMessages);
        } catch (error) {
            console.error('No messages');
            console.log('error', error)
        }


    };

    useEffect(() => {

        // Establish WebSocket connection when screen comes into focus
        const ws = new WebSocket('ws://10.10.10.1:81');

        ws.onopen = function (event) {
            // setIsConnecting(false); // Set connection status to false when WebSocket connection is established
            Toast.show('WebSocket connection established', {
                duration: Toast.durations.LONG,
            });
            console.log('WebSocket connection established');
        };

        // Event listener for incoming messages
        ws.onmessage = (event) => {
            const jsonString = event.data;
            const data = JSON.parse(jsonString);

            // Convert data object to a string for displaying in the toast
            const dataString = JSON.stringify(data);

            // Toast.show(dataString, {
            //     duration: Toast.durations.LONG,
            // });

            const decodedMessages = data.messages.map(msg => ({
                ...msg,
                message: decodeURIComponent(msg.message)
            }));


            setMessages(decodedMessages);
        };

        // Clean up WebSocket connection when screen loses focus or unmounts
        return () => {
            ws.close();
        };
    }, []);


    const handleSendMessage = async () => {
        if (inputMessage.trim() === '') {
            return;
        }

        // const url = `https://resnet-server.onrender.com/send?message=${encodeURIComponent(inputMessage)}&username=${receiver}&receiver=${username}&phoneNumber=${senderName}`;
        const url = `http://10.10.10.1/send?message=${encodeURIComponent(inputMessage)}&username=${receiver}&receiver=${username}&phoneNumber=${senderName}`;

        try {
            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            fetchMessages();
            setInputMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handlePressLocation = (latitude, longitude) => {
        // Navigate to MapScreen with latitude and longitude as p

        navigation.navigate('map', { latitude, longitude });
    };
    return (
        <RootSiblingParent>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <FlatList
                    data={messages}
                    renderItem={({ item }) => (item.receiver === receiver && item.username === username || item.receiver === username && item.username === receiver ?
                        <View style={[
                            styles.messageContainer,
                            item.phoneNumber === senderName ? styles.senderMessage : styles.receiverMessage
                        ]}>
                            {console.log(item.receiver)}
                            <Text style={[styles.username, item.phoneNumber === senderName ? styles.senderName : styles.receiverName]}>{item.username}</Text>
                            {/* Check if message contains latitude and longitude */}
                            {item.message.includes(',') ? (
                                <Pressable onPress={() => {
                                    const [latitude, longitude] = item.message.split(',');
                                    handlePressLocation(parseFloat(latitude), parseFloat(longitude));
                                }}>
                                    <Text style={[styles.messageText, item.phoneNumber === senderName ? styles.senderMessageText : styles.receiverMessageText]}>{item.message} <Feather name="external-link" size={20} style={styles.linkIcon} /></Text>

                                </Pressable>
                            ) : (
                                <Text style={[styles.messageText, item.phoneNumber === senderName ? styles.senderMessageText : styles.receiverMessageText]}>{item.message}</Text>
                            )}
                        </View> : null
                    )}
                    keyExtractor={(item) => item.id.toString()}
                />


                <View style={inputContainerStyle}>
                    <Pressable style={styles.button} onPress={fetchMessages}>
                        <MaterialIcons name="refresh" size={28} color="#006ee6" />
                    </Pressable>

                    <TextInput
                        style={styles.input}
                        value={inputMessage}
                        onChangeText={(text) => setInputMessage(text)}
                        placeholder=""
                        multiline
                    />

                    <Pressable style={styles.button} onPress={handleSendLocation}>
                        <Entypo name="location-pin" size={28} color="#006ee6" />
                    </Pressable>

                    <Pressable style={styles.button} onPress={handleSendMessage}>
                        <Feather name="send" size={26} color="#006ee6" />
                    </Pressable>
                </View>
                {loadingLocation && (
                    <View style={styles.spinnerContainer}>
                        <ActivityIndicator size="large" color="#0000ff" />
                    </View>
                )}
            </KeyboardAvoidingView>
        </RootSiblingParent>
    );
};

const styles = StyleSheet.create({
    linkIcon: {
        marginLeft: 10
    },
    button: {
        marginRight: 15,
    },
    username: {
        marginBottom: 5
    },
    senderName: {
        alignSelf: 'flex-end'
    },
    senderMessage: {
        alignSelf: 'flex-end',
    },
    senderMessageText: {
        alignSelf: 'flex-end',
        backgroundColor: '#006ee6',
        color: '#fff',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        padding: 10,
        overflow: 'hidden',
    },
    receiverMessage: {
        alignSelf: 'flex-start',
    },
    receiverMessageText: {
        alignSelf: 'flex-start',
        backgroundColor: '#dfdfdf',
        borderRadius: 10,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        padding: 10,
        overflow: 'hidden',
    },
    container: {
        flex: 1,
    },
    spinnerContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageContainer: {
        padding: 10,
        marginVertical: 5,
        alignSelf: 'flex-start',
        maxWidth: '100%',
    },
    messageText: {
        fontSize: 16,
        maxWidth: '100%',
        padding: 10,
        borderRadius: 10,
    },
    inputContainer: {
        backgroundColor: "#eee",
        paddingTop: 10,
        flexDirection: 'row',
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
    },
    input: {
        fontSize: 18,
        flex: 1,
        paddingHorizontal: 10,
        paddingBottom: 3,
        marginRight: 20,
        borderWidth: 1,
        height: 30,
        borderColor: '#ccc',
        borderRadius: 20,
    },
});

export default ChatScreen;
