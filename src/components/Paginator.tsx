import { View, Text, Animated, useWindowDimensions } from 'react-native'
import React from 'react'
import { Slide } from '../types/Slide'

interface HighLightSliderItemProps {
    data: Slide[];
    scrollX: Animated.Value;
}


const Paginator: React.FC<HighLightSliderItemProps> = ({ data, scrollX }) => {
    const { width } = useWindowDimensions();
    return (
        <View className='flex-row justify-center items-center h-8 '>
            {data.map((_: Slide, i: number) => {
                const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: "clamp",
                })
                return <Animated.View style={[{ opacity }]} className="h-3 w-3 rounded-full bg-dark-navy mx-2" key={i.toString()}></Animated.View>
            })}
        </View>
    )
}

export default Paginator