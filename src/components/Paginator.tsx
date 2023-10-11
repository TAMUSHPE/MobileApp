import { View, Animated, useWindowDimensions } from 'react-native'
import React from 'react'
import { Slide } from '../types/slides'

/**
 * This component displays a horizontal row of dots, corresponding to each slide in the slideshow.
 * The dot corresponding to the currently-viewed slide has increased opacity, making it appear "active".
 * 
 * @param data An array of slides to be displayed.
 * @param scrollX An animated value representing the horizontal scroll position of the slide list.
 * @returns Returns the rendered Paginator component.
 */
const Paginator: React.FC<PaginatorProps> = ({ data, scrollX }) => {
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

                return (
                    <Animated.View
                        style={[{ opacity }]}
                        className="h-3 w-3 rounded-full bg-dark-navy mx-2"
                        key={i.toString()}
                    ></Animated.View>
                );
            })}
        </View>
    )
}

interface PaginatorProps {
    data: Slide[];
    scrollX: Animated.Value;
}

export default Paginator