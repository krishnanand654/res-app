import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, Pressable, FlatList, StyleSheet, TouchableHighlight, ActivityIndicator } from "react-native"
import React, { useEffect, useState } from "react";
import { FAB } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-root-toast';
import { RootSiblingParent } from 'react-native-root-siblings';
import { useNavigation } from "@react-navigation/native";
const ChatListScreen = () => {
    const [messages, setMessages] = useState([]);
    const [phone, setPhoneNumber] = useState('');
    const [user, setUsername] = useState('');
    const [phoneExist, setPhoneExist] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false); // Track WebSocket connection status

    const navigation = useNavigation();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Retrieve the phone number from AsyncStorage
                const storedPhone = await AsyncStorage.getItem('phone');
                const storedUser = await AsyncStorage.getItem('username');

                setPhoneNumber(storedPhone);
                setUsername(storedUser);

                const response = await fetch('https://resnet-server.onrender.com/messages');
                // const response = await fetch('http://10.10.10.1/messages');


                if (response.ok) {
                    const data = await response.json();


                    const decodedMessages = data.messages.map(msg => ({
                        ...msg,
                        message: decodeURIComponent(msg.message)
                    }));

                    const phoneNumberExistsInMessages = data.messages.some(msg => msg.phoneNumber === storedPhone);

                    setPhoneExist(phoneNumberExistsInMessages);

                    // Set the decoded messages to state
                    setMessages(decodedMessages);
                } else {
                    setPhoneExist(false);
                }


            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [refresh]);

    useEffect(() => {

        // Establish WebSocket connection when screen comes into focus
        const ws = new WebSocket('ws://10.10.10.1:81');

        ws.onopen = function (event) {
            setIsConnecting(false); // Set connection status to false when WebSocket connection is established
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
    }, [refresh]);

    const handleSendMessage = async () => {
        const inputMessage = 'online';
        const url = `https://resnet-server.onrender.com/send?message=${encodeURIComponent(inputMessage)}&username=${user}&receiver=null&phoneNumber=${phone}`;
        // const url = `http://10.10.10.1/send?message=${encodeURIComponent(inputMessage)}&username=${user}&receiver=null&phoneNumber=${phone}`;


        try {
            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then((response) => {
                if (response.ok) {
                    setRefresh(!refresh);
                } else {
                    setRefresh(false);
                }
            });

            // Refetch data after sending message


        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleItemPress = (item) => {
        navigation.navigate('chat', {
            username: item.username,
            phoneNumber: item.phoneNumber
        });
    };
    const distinctMessages = messages.filter((msg, index, self) => self.findIndex(m => m.phoneNumber === msg.phoneNumber) === index);
    return (
        <RootSiblingParent>
            <View style={styles.container}>
                {isConnecting ? ( // Render loader while connecting to WebSocket
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : phoneExist ? (
                    <FlatList
                        data={distinctMessages}
                        renderItem={({ item }) => (item.phoneNumber != phone ? (
                            <>
                                <TouchableHighlight onPress={() => handleItemPress(item)}>
                                    <View style={styles.itemContainer}>
                                        <Text style={styles.username}>{item.username}</Text>
                                        <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
                                        <Text style={styles.status}>{item.message}</Text>
                                    </View>
                                </TouchableHighlight></>) : null
                        )}
                        keyExtractor={item => item.id.toString()}
                    />
                ) : (
                    <TouchableHighlight onPress={handleSendMessage}>
                        <Text>Set Online</Text>
                    </TouchableHighlight>)
                }

                <FAB
                    icon="plus"
                    style={styles.fab}
                    onPress={() => { setRefresh(!refresh) }}
                />

            </View>
        </RootSiblingParent>

    )
}


const styles = StyleSheet.create({
    container: {
        height: '100%',
    },
    itemContainer: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    phoneNumber: {
        fontSize: 14,
        color: '#666',
    },
    status: {
        fontSize: 14,
        color: 'green', // Green color for online status
    },
    fab: {
        position: 'absolute',
        margin: 10,
        right: 20,
        bottom: 20, // Adjust this value to set the desired distance from the bottom
    }

});

export default ChatListScreen;
