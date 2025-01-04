import React, { useEffect, useState } from 'react';
import { View, Animated, Easing } from 'react-native';


const ProgressBar = ({ progress }: { progress: number }) => {
    progress = progress <= 1 ? progress : 1;
    progress = progress < 0 ? 0 : progress;

    const [progressValue] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.timing(progressValue,
            {
                toValue: progress,
                duration: 1000,
                easing: Easing.linear,
                useNativeDriver: false,
            }).start();
    }, [progress]);

    const width = progressValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View className='w-[100%] h-3 bg-[#cccccc] rounded-md'>
            <Animated.View className="h-full bg-primary-blue rounded-md" style={{ width }} />
        </View>
    );
};

export default ProgressBar;

