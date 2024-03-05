import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const ChatScreen = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [senderName, setSenderName] = useState('');

    useEffect(() => {
        retrieveData();
    }, []);

    const retrieveData = async () => {
        try {
            const value = await AsyncStorage.getItem('username');
            if (value !== null) {
                setSenderName(value);
            }
        } catch (error) {
            console.error('Error retrieving data:', error);
        }
    };

    console.log(senderName);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            // const response = await fetch('http://10.10.10.1/messages');
            // const data = await response.json();
            // setMessages(data.messages);
            const localMessages = [
                { id: 1, username: 'user1', message: 'Hello' },
                { id: 2, username: 'user2', message: 'Hi' },
                { id: 3, username: 'user1', message: 'How are you?' },
                // Add more messages as needed
            ];

            setMessages(localMessages);


        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async () => {
        if (inputMessage.trim() === '') {
            return;
        }
        console.log("invoked")

        const url = `http://10.10.10.1/send?message=${encodeURIComponent(inputMessage)}&username=${senderName}`;

        try {
            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log("send")

            // After sending the message, fetch messages again to update the list
            fetchMessages();
            setInputMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };


    return (
        <View style={styles.container}>
            <FlatList
                data={messages}
                renderItem={({ item }) => (
                    <View style={styles.messageContainer}>
                        <Text style={styles.messageText}>{item.username}: {item.message}</Text>
                    </View>
                )}
                keyExtractor={(item) => item.id.toString()}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={inputMessage}
                    onChangeText={(text) => setInputMessage(text)}
                    placeholder="Type your message..."
                    multiline
                />
                <Button title="Send" onPress={handleSendMessage} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    messageContainer: {
        padding: 10,
        backgroundColor: '#eee',
        marginVertical: 5,
        borderRadius: 10,
        alignSelf: 'flex-start',
        maxWidth: '80%',
    },
    messageText: {
        fontSize: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
    },
    input: {
        flex: 1,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
    },
});

export default ChatScreen;
