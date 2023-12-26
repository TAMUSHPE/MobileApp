import { View, FlatList, Animated, NativeSyntheticEvent, NativeScrollEvent, Dimensions } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import FeaturedItem from './FeaturedItem';
import Paginator from './Paginator';
import { Slide } from '../types/slides';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const windowWidth = Dimensions.get('window').width;

const FeaturedSlider: React.FC<FeaturedSliderProps> = ({ route, getDelete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [slides, setSlides] = useState<Slide[]>([]);
    const slideListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slideInterval = useRef<NodeJS.Timeout>();

    const shuffleSlides = (array: Slide[]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    useEffect(() => {
        const slidesCollection = collection(db, "featured-slides");
        const slideQuery = query(slidesCollection, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(slideQuery, (snapshot) => {
            let slidesData = snapshot.docs.map(doc => doc.data() as Slide);

            // Check if not in FeaturedSlideEditor route
            if (route.name !== "FeaturedSlideEditor") {
                // Shuffle slides and add first and last slide to the beginning and end
                slidesData = shuffleSlides([...slidesData]);
                if (slidesData.length > 1) {
                    slidesData = [slidesData[slidesData.length - 1], ...slidesData, slidesData[0]];
                }
            }

            setSlides(slidesData);
        });

        return () => unsubscribe();
    }, [route.name]);


    useEffect(() => {
        if (route.name !== "FeaturedSlideEditor") {
            slideInterval.current = setInterval(() => {
                setCurrentIndex(prevIndex => {
                    let nextIndex = prevIndex + 1;
                    if (nextIndex >= slides.length) {
                        // Immediately jump to the first real slide (index 1) when reaching the end
                        slideListRef.current?.scrollToIndex({ animated: false, index: 1 });
                        nextIndex = 1;
                    } else {
                        slideListRef.current?.scrollToIndex({ animated: true, index: nextIndex });
                    }
                    return nextIndex;
                });
            }, 3000); // Change slide every 3 seconds
        }

        return () => clearInterval(slideInterval.current!);
    }, [slides, route.name]);
    return (
        <View>
            <LinearGradient
                className='absolute top-0 left-0 bottom-0 right-0'
                colors={['#ffffff', '#72A9BE']}
            />
            <FlatList
                data={slides}
                renderItem={({ item }) => <FeaturedItem item={item} route={route} getDelete={getDelete} />}
                {...flatListProps}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                    useNativeDriver: false,
                })}
                ref={slideListRef}
                keyExtractor={(item, index) => `${item.id}-${index}`}

            />
            {route.name === "FeaturedSlideEditor" && <Paginator data={slides} scrollX={scrollX} />}
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

interface FeaturedSliderProps {
    route: any;
    getDelete?: (id: Slide) => void;
}

export default FeaturedSlider;
