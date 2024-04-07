import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from "@react-native-community/slider";

export default function SetAngle() {
    const [angle, setAngle] = useState(90);

    const handleSliderChange = (value) => {
        setAngle(value);
        sendAngleRequest(value); // Send HTTP GET request with the new angle value
    };

    const sendAngleRequest = (angleValue) => {
        fetch(`http://10.10.10.1/setAngle?angle=${angleValue}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(data => {
                console.log(data); // Log the response data if needed
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.angleText}>Angle: {angle}</Text>
            <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={180}
                step={90}
                value={angle}
                onValueChange={handleSliderChange}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    angleText: {
        fontSize: 20,
        marginBottom: 20,
    },
    slider: {
        width: '80%',
    },
});
