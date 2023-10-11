import { View, FlatList, Animated, ViewToken } from 'react-native';
import React, { useState, useRef, RefObject, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import HighLightSliderItem from './HighLightSliderItem';
import Paginator from './Paginator';
import { Slide } from '../types/slides'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

/**
 * This component renders a horizontal list of slides with pagination.
 * It utilizes the `HighLightSliderItem` component to render each individual slide.
 * Additionally, it uses the `Paginator` component for the pagination of slides.
 * 
 * @returns The rendered highlight slider component.
 */

const HighlightSlider: React.FC<HighlightSliderProps> = ({ route, getDelete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [slides, setSlides] = useState<Slide[]>([]);
    const slideListRef: RefObject<FlatList<Slide>> = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index ?? 0);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    useEffect(() => {
        const slidesCollection = collection(db, "featured-slides");
        const slideQuery = query(slidesCollection, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(slideQuery, (snapshot) => {
            const newSlides = snapshot.docs.map(doc => doc.data() as Slide);
            setSlides(newSlides);
        });

        return () => unsubscribe();
    }, []);

    return (
        <View className='mt-0'>
            <View>
                <LinearGradient
                    className='absolute top-0 left-0 bottom-0 right-0'
                    colors={['#191740', '#72A9BE']}
                />
                <FlatList
                    data={slides}
                    renderItem={({ item }) => <HighLightSliderItem item={item} route={route} getDelete={getDelete} />}
                    {...flatListProps}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                        useNativeDriver: false,
                    })}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={viewConfig}
                    ref={slideListRef}
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

interface HighlightSliderProps {
    route: any;
    getDelete?: (id: Slide) => void;
}

export default HighlightSlider;
