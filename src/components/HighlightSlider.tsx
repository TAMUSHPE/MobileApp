import { View, Text, ScrollView, Image, FlatList, Animated, ViewToken } from 'react-native';
import React, { useState, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import HighLightSliderItem from './HighLightSliderItem';
import { slides } from './slides'
import { Slide } from '../types/Slide'
import Paginator from './Paginator';

interface SlideItem {
    index: number;
    item: Slide;
}

const HighlightSlider = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const slidesRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
        setCurrentIndex(viewableItems[0].index ?? 0);
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    return (
        <View
            className='mt-0'
        >
            <View>
                <LinearGradient
                    className='absolute top-0 left-0 bottom-0 right-0'
                    colors={['#191740', '#72A9BE']}
                />
                <FlatList
                    data={slides}
                    renderItem={({ item }) => <HighLightSliderItem item={item} />}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                        useNativeDriver: false,
                    })}
                    scrollEventThrottle={32}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={viewConfig}
                    ref={slidesRef}
                />
            </View>

            <Paginator data={slides} scrollX={scrollX} />


        </View>
    )
}

export default HighlightSlider;
