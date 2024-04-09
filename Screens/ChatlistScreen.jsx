import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, Pressable, FlatList, Image, StyleSheet, TouchableHighlight, ActivityIndicator } from "react-native"
import React, { useEffect, useState } from "react";
import { FAB } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-root-toast';
import { RootSiblingParent } from 'react-native-root-siblings';
import { useNavigation } from "@react-navigation/native";
import { useRef } from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import { Button } from 'react-native';
import { useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useCallback } from 'react';
import { Switch } from 'react-native-paper';
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Platform } from "react-native";



const margin = Platform.OS === 'ios' ? 20 : 10;

const ChatListScreen = () => {

    const [isSwitchOn, setIsSwitchOn] = useState(false);
    const [loading, setLoading] = useState(false);

    const onToggleSwitch = () => {
        setIsSwitchOn(!isSwitchOn)
        setLoading(!isSwitchOn);
        handleSendMessage();

    };




    const snapPoints = useMemo(() => ['25%'], []);

    const bottomSheetRef = useRef(null); // Use useRef() here

    const handleClosePress = useCallback(() => bottomSheetRef.current?.close(), [bottomSheetRef]);
    // const handleOpenPress = useCallback(() => bottomSheetRef.current?.expand(), [bottomSheetRef]);
    const handlePresentModalPress = useCallback(() => {
        bottomSheetRef.current?.present();
    }, []);

    const [messages, setMessages] = useState([]);
    const [phone, setPhoneNumber] = useState('');
    const [user, setUsername] = useState('');
    const [phoneExist, setPhoneExist] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false); // Track WebSocket connection status

    const navigation = useNavigation();


    useEffect(() => {
        handlePresentModalPress(); // Open the modal when the component mounts
    }, [])

    useEffect(() => {

        const fetchData = async () => {
            try {
                // Retrieve the phone number from AsyncStorage
                const storedPhone = await AsyncStorage.getItem('phone');
                const storedUser = await AsyncStorage.getItem('username');
                console.log(storedPhone);
                setPhoneNumber(storedPhone);
                setUsername(storedUser);

                // const response = await fetch('https://resnet-server.onrender.com/messages');
                const response = await fetch('http://10.10.10.1/messages');


                if (response.ok) {
                    const data = await response.json();


                    const decodedMessages = data.messages.map(msg => ({
                        ...msg,
                        message: decodeURIComponent(msg.message)
                    }));

                    const phoneNumberExistsInMessages = data.messages.some(msg => msg.phoneNumber === storedPhone);

                    setPhoneExist(phoneNumberExistsInMessages);
                    setLoading(false);
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
    }, [refresh,]);

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
            setLoading(false);
            setIsSwitchOn(false);
            handleClosePress();
        };

        // Clean up WebSocket connection when screen loses focus or unmounts
        return () => {
            ws.close();
        };
    }, [refresh]);

    const handleSendMessage = async () => {
        const inputMessage = 'online';
        // const url = `https://resnet-server.onrender.com/send?message=${encodeURIComponent(inputMessage)}&username=${user}&receiver=null&phoneNumber=${phone}`;
        const url = `http://10.10.10.1/send?message=${encodeURIComponent(inputMessage)}&username=${user}&receiver=null&phoneNumber=${phone}`;


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

                    <View style={styles.container}>
                        <BottomSheetModal ref={bottomSheetRef} index={0} snapPoints={snapPoints}

                            backgroundStyle={{ backgroundColor: "white" }}>

                            {/* <Button title="close" onPress={handleClosePress} /> */}
                            <View style={styles.switchctn}>
                                <Text style={styles.switchText}>Go Online</Text>
                                <Switch value={isSwitchOn} onValueChange={onToggleSwitch} color={'#5BC236'} />
                            </View>
                            <Text style={styles.onlineinfo} >Activate the toggle button to set your status as online, enabling others to find you easily. Simultaneously, you'll be able to discover others who are also online.</Text>
                        </BottomSheetModal>
                        <View style={styles.landing}>
                            <Text>Waiting to get online...</Text>
                            <Button style={styles.onlineBtn} title='Go Online' onPress={handlePresentModalPress} />
                        </View>
                    </View>
                )
                }

                <FAB

                    icon={() => (
                        <Image
                            source={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB3ElEQVR4nO1WW0tbQRD+fO6rphWiYGn7b4oKsVILpY9pPTOJ8Sf4K0TUvpRe0NBC63/R6kuTmRMV9cUXr5HdPYmJuZ2crNIHPxg4nJ3db2d2bsAj/juwjIMkD5I/INkDyakT3QHLFlgCFMpjvgk/g+UcrNXuYnVWBr8AaQakJ/VDSb8gkLfIV55jMXxiZeHfC/uP9Gv9cmYPlV8nI80fjILkyh0kG9byXgjCCadrL3oN1mwC5uoQWJaQ0/d9bzWxYInlEjmZSkA+AEgLkduPQDry0OS/IvK17oq5cMaKL5i4cEF51tlqs8ByYMWna2rBRpLvpPCjno/m2xdMqrGN8s02pOGblmLgy+Xz5VfRO/9tXijIMFj2W4hJD8GVp4kJGz3ILRXuew8F/ZmY2BhEUmlrUDZMNSuz7DqF0kv4AMlkvCckLbrF8qwX4thBS7Vq4zGqY6VpNkzdJnwp7Y08F6cwsaxHQVDEgyJrrNbj7tXmvsAybVuaaW2BcN/7g/CDbammtfYN0o9RM3eDgGnyvQknbO67PVf4tP+sf2IDM77U3O6Czow3c7YMNo4+JO9A+g0kFw09OIOBQKU0WJdjDXsmG1hXvWYEzGEUztvxlnX7znj7GyTkl/AR8IMbVJ2yLEgVnrYAAAAASUVORK5CYII=' }}
                            style={[

                                {
                                    width: 25,
                                    height: 24,

                                }
                            ]}
                        />
                    )}
                    style={[styles.fab, { backgroundColor: 'white' }]}
                    onPress={() => { setRefresh(!refresh) }}
                />

            </View>
            {loading && (
                <View style={styles.spinnerContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            )}
        </RootSiblingParent>

    )
}


const styles = StyleSheet.create({
    container: {
        height: '100%',
    },
    spinnerContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    landing: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    onlineinfo: {
        fontSize: 14,
        marginTop: margin,
        color: 'gray',
        paddingLeft: 30,
        paddingRight: 30,
        width: '100%',

    },
    switchctn: {
        marginTop: margin,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 30,
        paddingRight: 30,

    },
    onlineBtn: {
        backgroundColor: 'white',
        marginTop: margin,
    },
    switchText: {
        marginTop: 6,
        fontSize: 18,
        fontWeight: '400'

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
        bottom: 20,

        // Adjust this value to set the desired distance from the bottom
    }

});

export default ChatListScreen;
