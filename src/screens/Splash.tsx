import { View, Text } from 'react-native'
import React, { useEffect, useRef } from 'react'
import LottieView from "lottie-react-native"

interface SplashProps {
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
}

const Splash = ({ setIsLoading }: SplashProps) => {
    // IOS bugged autoplay on lottie, so we need to use a ref to play the animation
    const ref = useRef<LottieView>(null);
    useEffect(() => {
        const timeoutId = setTimeout(() => ref.current?.play());

        return () => {
            clearTimeout(timeoutId);
            ref.current?.reset();
        }
    }, []);

    return (
        <View
            className="flex-1 align-center m-0"
        >
            <LottieView
                ref={ref}
                source={require("../../assets/splash_shpe_animated.json")}
                autoPlay
                loop={false}
                resizeMode="cover"
                onAnimationFinish={() => setIsLoading(false)}
            />

        </View>
    )
}

export default Splash