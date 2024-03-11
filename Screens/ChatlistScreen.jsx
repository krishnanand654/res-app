import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, Pressable, FlatList, StyleSheet, TouchableHighlight } from "react-native"
import { useEffect, useState } from "react";
import { FAB } from 'react-native-paper';

const ChatListScreen = () => {
    const [messages, setMessages] = useState([]);
    const [phone, setPhoneNumber] = useState('');
    const [user, setUsername] = useState('');
    const [phoneExist, setPhoneExist] = useState(false);
    const [refresh, setRefresh] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Retrieve the phone number from AsyncStorage
                const storedPhone = await AsyncStorage.getItem('phone');
                const storedUser = await AsyncStorage.getItem('username');

                setPhoneNumber(storedPhone);
                setUsername(storedUser);

                const response = await fetch('https://resnet-server.onrender.com/messages');

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

    const handleSendMessage = async () => {
        const inputMessage = 'online';
        const url = `https://resnet-server.onrender.com/send?message=${encodeURIComponent(inputMessage)}&username=${user}&receiver=null&phoneNumber=${phone}`;

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

    return (
        <View style={styles.container}>
            {phoneExist ? (
                <FlatList
                    data={messages}
                    renderItem={({ item }) => (item.phoneNumber != phone ?
                        <View style={styles.itemContainer}>
                            <Text style={styles.username}>{item.username}</Text>
                            <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
                            <Text style={styles.status}>{item.message}</Text>
                        </View> : null
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
