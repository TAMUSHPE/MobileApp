import React, { useEffect, useState } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';

interface ProgressBarProps {progress: number;} //this is how you pass in percentage. To be used whenever needed

const ProgressBar: React.FC<ProgressBarProps> = ({progress}) => 
{
    progress = progress <= 1 ? progress: 1;
    progress = progress < 0 ? 0 : progress;

    const [progressValue] = useState(new Animated.Value(0)); //creates the animation

    useEffect(() => { //useEffect makes it so the animation doesn't reset every time
        Animated.timing(progressValue, 
            {
                toValue: progress,
                duration: 1000, //Adjust the duration as needed. 
                easing: Easing.linear, //easing means smooth animation
                useNativeDriver: false, // If set to true, border radius for rounded corners does not work
            }).start();
    }, [progress]);

    const width = progressValue.interpolate({
        inputRange: [0, 1], //what is taken in (we have accounted for negative values or values greater than 1)
        outputRange: ['0%', '100%'], //what is displayed (on the bar itself)
    });

    return (
        <View style={styles.progressBarContainer}>

            <Animated.View style = {[styles.progressBar, {width}]}/> 

        </View>
    );
    //Animated.View allows for animations through React Native
};

const styles = StyleSheet.create
({
    progressBarContainer: {
        width: '80%',
        height: 10,
        backgroundColor: '#cccccc', //feel free to change
        borderRadius: 5,
    },
    progressBar: {
        height: '100%',
        backgroundColor: 'blue', //feel free to change
        borderRadius: 5,
    },
});

export default ProgressBar;

