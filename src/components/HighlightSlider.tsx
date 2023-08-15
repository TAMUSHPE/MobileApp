import { View, FlatList, Animated, ViewToken } from 'react-native';
import React, { useState, useRef, RefObject } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import HighLightSliderItem from './HighLightSliderItem';
import { slides } from './slides'
import Paginator from './Paginator';
import { Slide } from '../types/Slide';

/**
 * This component renders a horizontal list of slides with pagination.
 * It utilizes the `HighLightSliderItem` component to render each individual slide.
 * Additionally, it uses the `Paginator` component for the pagination of slides.
 * 
 * @returns The rendered highlight slider component.
 */
const HighlightSlider = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const slidesRef: RefObject<FlatList<Slide>> = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
        setCurrentIndex(viewableItems[0].index ?? 0);
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    return (
        <View className='mt-0'>
            <View>
                <LinearGradient
                    className='absolute top-0 left-0 bottom-0 right-0'
                    colors={['#191740', '#72A9BE']}
                />
                <FlatList
                    data={slides}
                    renderItem={({ item }) => <HighLightSliderItem item={item} />}
                    {...flatListProps}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                        useNativeDriver: false,
                    })}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={viewConfig}
                    ref={slidesRef}
                />
            </View>
            <Paginator data={slides} scrollX={scrollX} />
        </View>
    )
}

const flatListProps = {
    horizontal: true,
    showsHorizontalScrollIndicator: false,
    pagingEnabled: true,
    bounces: false,
    keyExtractor: (item: Slide) => item.id,
    scrollEventThrottle: 32
};

export default HighlightSlider;
