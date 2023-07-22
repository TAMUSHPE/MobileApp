import { View, Text } from 'react-native'
import React from 'react'
import LottieView from "lottie-react-native"

interface SplashProps {
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
}

const Splash = ({ setIsLoading }: SplashProps) => {
    return (
        <View
            className="flex-1 align-center m-0"
        >
            <LottieView
                source={require("../../assets/splash_animation.json")}
                autoPlay
                loop={false}
                resizeMode="cover"
                onAnimationFinish={() => setIsLoading(false)}
            />

        </View>
    )
}

export default Splash