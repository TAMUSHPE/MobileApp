import React, { useEffect, useRef } from 'react'
import LottieView from "lottie-react-native";
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const Splash = ({ setIsLoading }: SplashProps) => {
    // IOS bugged autoplay on lottie, so we need to use a ref to play the animation
    const animationRef = useRef<LottieView>(null);

    useEffect(() => {
        const timeoutId = setTimeout(() => animationRef.current?.play());

        return () => {
            clearTimeout(timeoutId);
            animationRef.current?.reset();
        }
    }, []);

    return (
        <View className='flex-1'>
            <StatusBar style="light" />
            <LottieView
                ref={animationRef}
                source={require("../../assets/splash_minimal_tamu.json")}
                loop={false}
                resizeMode="cover"
                onAnimationFinish={() => setIsLoading(false)}
            />
        </View>
    )
}

interface SplashProps {
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
}

export default Splash