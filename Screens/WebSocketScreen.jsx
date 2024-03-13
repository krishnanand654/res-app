import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import Toast from 'react-native-root-toast';
import { RootSiblingParent } from 'react-native-root-siblings';
import { useFocusEffect } from '@react-navigation/native';

const WebSocketScreen = ({ navigation }) => {
    const [messages, setMessages] = useState([]);

    useFocusEffect(
        React.useCallback(() => {
            Toast.show('hi', {
                duration: Toast.durations.LONG,
            });
            // Establish WebSocket connection when screen comes into focus
            const ws = new WebSocket('ws://10.10.10.1:81');

            ws.onopen = function (event) {
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

                Toast.show(dataString, {
                    duration: Toast.durations.LONG,
                });

                setMessages(data.messages);
            };

            // Clean up WebSocket connection when screen loses focus or unmounts
            return () => {
                ws.close();
            };
        }, [])
    );

    return (
        <RootSiblingParent>
            <View>
                <Button title="Fetch Data" onPress={() => { }} disabled={true} />
                <Text>Messages:</Text>
                {messages.map((message, index) => (
                    <View key={index}>
                        <Text>{message.username}: {message.message}</Text>
                    </View>
                ))}
            </View>
        </RootSiblingParent>
    );
};

export default WebSocketScreen;
