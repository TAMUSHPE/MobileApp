import React from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';

interface ProgressBarProps {progress: number;} //this is how you pass in percentage. To be used whenever needed

const ProgressBar: React.FC<ProgressBarProps> = ({progress}) => 
{
    const progressValue = new Animated.Value(0); //creates the animation

    Animated.timing(progressValue, 
    {
        toValue: progress,
        duration: 1000, //Adjust the duration as needed. pretty sure this is milliseconds but I have not been able to test
        easing: Easing.linear, //easing means smooth animation
        useNativeDriver: false, // If set to true, border radius for rounded corners does not work
    }).start();

    const width = progressValue.interpolate({
        inputRange: [0, 1], //what is taken in
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
        backgroundColor: '#cccccc',
        borderRadius: 5,
    },
    progressBar: {
        height: '100%',
        backgroundColor: 'blue', //haven't been able to see this color yet, will set manually when tested for the first time
        borderRadius: 5,
    },
});

export default ProgressBar;

/**
 * The ProgressBar is yet to be implemented anywhere and I am yet to test any of it. 
 * I also have no way of currently passing in any value to ensure that it works.
 * Once I am able to see what it looks like, I would like to make the necessary changes
 * myself. 
 */
