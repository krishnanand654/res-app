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
import { Image } from 'expo-image';
import { StatusBar } from 'react-native';

const ChatScreen = ({ route }) => {
    const { username, phoneNumber } = route.params;
    // username = "hi";
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [senderNumber, setSenderNumber] = useState('');
    const [senderName, setSenderName] = useState('');

    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [receiver, setReceiver] = useState('');
    const [imageError, setImageError] = useState(false);

    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({
            headerTitle: username,
            headerStyle: {
                backgroundColor: '#FFFFFF', // Change this to the desired color
            },
            headerTintColor: '#000000', // Change text color
            headerTitleStyle: {
                fontWeight: 'bold',
            },
        });

        // Set status bar style
        StatusBar.setBarStyle('dark-content'); // Set status bar content to dark color
    }, []);


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
                const trimmedValue = value.trim();
                const trimmedUserValue = uservalue.trim();
                setSenderNumber(trimmedValue);
                setSenderName(trimmedUserValue);
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
                duration: Toast.durations.SHORT,
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

        // const url = `https://resnet-server.onrender.com/send?message=${encodeURIComponent(inputMessage)}&username=${senderName}&receiver=${phoneNumber}&phoneNumber=${senderNumber}`;
        const url = `http://10.10.10.1/send?message=${encodeURIComponent(inputMessage)}&username=${senderName}&receiver=${phoneNumber}&phoneNumber=${senderNumber}`;

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
                    renderItem={({ item }) => (item.receiver === phoneNumber && item.phoneNumber === senderNumber || item.receiver === senderNumber && item.phoneNumber === phoneNumber ?
                        <View style={[
                            styles.messageContainer,
                            item.phoneNumber === senderNumber ? styles.senderMessage : styles.receiverMessage
                        ]}>
                            <Text style={[styles.username, item.phoneNumber === senderNumber ? styles.sender : styles.receiverName]}>{item.username}</Text>
                            {/* Check if message contains latitude and longitude */}
                            {item.message.includes(',') ? (
                                <Pressable onPress={() => {
                                    const [latitude, longitude] = item.message.split(',');
                                    handlePressLocation(parseFloat(latitude), parseFloat(longitude));
                                }}>
                                    <View style={styles.mapMsg}>
                                        <Text style={[styles.messageText, item.phoneNumber === senderNumber ? styles.senderMessageText : styles.receiverMessageText]}>{item.message} </Text>
                                        <Image source={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAtElEQVR4nO2VQQrCMBBF3yUMHkE8Sc9tFy50ZRfuU5DeYqRQoSgTZ0KsWPNhlvNf+/NJoOpH1QKizPFbYGEhbYDL0uAAdBOss4IboH8T2fMMwF6BBis4FoZiBeeex/xMr8DW6ykZYO1P520/lAZr0Ef8ZokDrMW7A26fAodEvENOT8SwlCqS5+PdS6dEkaweWUvjhX9WoFaPF5W4VyvYpBr1+ssVne+xNqOPS00BeJx8qv5Yd5herU1jqGmdAAAAAElFTkSuQmCC' }} style={{
                                            width: 20,
                                            height: 20,
                                            verticalAlign: 'middle', // Aligns the image vertically with the text
                                            marginTop: '10px',
                                            marginLeft: '10px'
                                        }} />
                                    </View>

                                </Pressable>
                            ) : (
                                <Text style={[styles.messageText, item.phoneNumber === senderNumber ? styles.senderMessageText : styles.receiverMessageText]}>{item.message}</Text>
                            )}
                        </View> : null
                    )}
                    keyExtractor={(item) => item.id.toString()}
                />


                <View style={inputContainerStyle}>
                    <Pressable style={styles.button} onPress={fetchMessages}>
                        {/* <MaterialIcons name="refresh" size={28} color="#006ee6" /> */}
                        <Image
                            style={styles.reloadIcon}
                            source={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB3ElEQVR4nO1WW0tbQRD+fO6rphWiYGn7b4oKsVILpY9pPTOJ8Sf4K0TUvpRe0NBC63/R6kuTmRMV9cUXr5HdPYmJuZ2crNIHPxg4nJ3db2d2bsAj/juwjIMkD5I/INkDyakT3QHLFlgCFMpjvgk/g+UcrNXuYnVWBr8AaQakJ/VDSb8gkLfIV55jMXxiZeHfC/uP9Gv9cmYPlV8nI80fjILkyh0kG9byXgjCCadrL3oN1mwC5uoQWJaQ0/d9bzWxYInlEjmZSkA+AEgLkduPQDry0OS/IvK17oq5cMaKL5i4cEF51tlqs8ByYMWna2rBRpLvpPCjno/m2xdMqrGN8s02pOGblmLgy+Xz5VfRO/9tXijIMFj2W4hJD8GVp4kJGz3ILRXuew8F/ZmY2BhEUmlrUDZMNSuz7DqF0kv4AMlkvCckLbrF8qwX4thBS7Vq4zGqY6VpNkzdJnwp7Y08F6cwsaxHQVDEgyJrrNbj7tXmvsAybVuaaW2BcN/7g/CDbammtfYN0o9RM3eDgGnyvQknbO67PVf4tP+sf2IDM77U3O6Czow3c7YMNo4+JO9A+g0kFw09OIOBQKU0WJdjDXsmG1hXvWYEzGEUztvxlnX7znj7GyTkl/AR8IMbVJ2yLEgVnrYAAAAASUVORK5CYII=' }}
                            accessibilityLabel="reload"
                        />

                    </Pressable>

                    <TextInput
                        style={styles.input}
                        value={inputMessage}
                        onChangeText={(text) => setInputMessage(text)}
                        placeholder=""
                        multiline
                    />

                    <Pressable style={styles.buttonLoc} onPress={handleSendLocation}>
                        {/* <Entypo name="location-pin" size={28} color="#006ee6" /> */}

                        <Image
                            style={styles.LocIcon}
                            source={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAC6UlEQVR4nO2ZyWsUQRSHf26oGEVEiaIgiIKgoCeXP8Cb6MntlJvgMFWdSRQPHoISgjdJPLj9BR704E28KK4R0UtA8RKc9Hs9k0RQTCTRaEvVDBqzjFVjVU2P+MGDZrqp6Y+q96qqC/jPHJwZWYk8nYDg6xD0HJKGIelLNdR1v74n4+P62czRPrwBgq5A8jgkp4ahnr2BQnFro18fEG+XQtAFCBqzEJgRqrf4om6rIXTQWgh6UL/AjBD8BLny+rASMtkJwUVnEr9k3um2w0iUWr1I/CZTavUr0Ta4TA8BXxLyZzz2mzMqsf1LpNXo8Vli/6I6WQ+xSbSXtrgXqcwTaeC45lYiV26BpE/BRQSN6f92hlp22L3EBCT3Ikr2ojNZoUNdS+6r3rOQSY66E9HrI+OxHSM/tGvetqJ4t37GWIauOhRRC0DDnqglMV3GtGcEPXMowiOGIr0WbV427JGyS5FJoz/NJ3vM2yztM+5lZ5gOA5sKoyuhUc59diciqORcRIyuMswRdici+XXDhpagAZcidwzHc5+HZL/lUqTHODFVaf0TlbnErIBIOu9ORM2uNhNiLRnbCTGKDzkU4XUQ9M1CZlIPHZUHqgCoiOL9ld9Me4JVfnzVRcEpgl8Zv4CrEPzQrUT4TVVaFTntXiRP28OK0HfkeDO8IPllQJH78IbgU8FEoviYP5HKTvGD/9wgxsl0Cbwi+VKAJD8H74ihTdbbVbvc+IhocDWCoLaf/kS6EYxCcaOXb1yC36NQXIOgqMWc+97IIziF4nKnH7MFv/FfqeZDcpu73kgOomF0pQsh+YUDkXtoOJH6RqWPz+qVGIcc2oZMII13kHPlRgcyg9CHogN1VKl+HEkXIVMI9VWEpixEJtCe7EAmkdRtIdKJzNKVLobkRwYSd3XFyzRCLypHa+RFWR/jNQWCDuut6myJKUg6gKZCctfsUktn0XykCyDp5rT54rb+rSnJlVv0iZOkp24PNfHv8gP38Rjypcg7bwAAAABJRU5ErkJggg==' }}
                            accessibilityLabel="loc"
                        />

                    </Pressable>

                    <Pressable style={styles.button} onPress={handleSendMessage}>
                        {/* <Feather name="send" size={26} color="#006ee6" /> */}
                        {imageError ? (
                            <Text>Send</Text>
                        ) : (
                            <Image
                                source={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAACg0lEQVR4nO2YzWpTURDH/7pR8GsliDutoFZ9AzeiIvgEgqArKyaZSUVc67KIoFJ9CReCivgcVbuwokXJzE20RhF0Y9sr5yStrbnJ/c49V+4PDiQ3IZlfZs7cOQEqKir+D6a6e0ByEbS0G6Wk2ToMkkcgeY96+4S9VhqZW/5WNFpnQPIcLKtg+bwu0dSj4NYFOM3NL7vAOgWWebD6vbVBoiFHQPrOlpmTXP90CKwzYO3+FQiQYPFAOgu38Lf0y+cxWJY3C2iwhCkz89gJap2dtnxI3gwGryMk7PWXRYcPUGciuHyiSqhZ54sTYDk5vHwGJDpDJcwmN92soPJ5HR78Bgn2jgdKmNUQHp/AdPugLR/Sr9EFAiRIdNPrJD/G03JjlU9MCbbrQX7BX17cjqZeAsur+MHHkZBVO6ZkTv3jfpDcButScoHImfBB8iKf8iH5nU4ghgSrj6acSx88LWyz5UM6lz74BBKkC+labmblM0KiN54Pl2Aj4tVTZEFnk3WfkEXSBulk/zsm7fPR0t/tNJwYlg/FS6gpq/tIRa2zz34I6a/MJMxhKJaErNjRPhNI9/aHvJ+p9sS0dyzynuD19SwbiUyEEkv4YDmbvUgioTQS+tYeunInVOgfCVaJt6f0Wv4SYUJmI6eT+GaPAIWwJkSymEqi90PcRfH06zroUBRNYsWeZ5zAzEVJb6ikT+EUrPeS3XNap+EUZjKIf8+ZH0/LzTsrDb0KJ6nFyIppuTe8HXAWjpoVuQOnqUXJiiyj4R2A83BIVkifoBTUQrJC3imUBh6SFfNvvJMtN25WmnIFpYMHstJ1u+VGz8oMSguvZaUsLXdkVsxkLA+HvqeiogJ58QdymDceDKJ19AAAAABJRU5ErkJggg==' }}
                                style={{ width: 30, height: 30 }} // Adjust dimensions as needed
                            />

                        )}
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
    reloadIcon: {
        marginLeft: 15,
        marginRight: 10,
        marginTop: 3,
        width: 24,
        height: 24,
    },
    LocIcon: {

        marginTop: 3,
        width: 24,
        height: 24,
    },
    mapMsg: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    sendIcon: {
        marginTop: 0,
        width: 29,
        height: 29,
    },
    linkIcon: {
        marginLeft: 10
    },
    button: {
        marginRight: 10,
    },
    buttonLoc: {
        marginRight: 18,
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
        paddingHorizontal: 10,
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
