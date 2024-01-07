import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState, useRef, memo } from 'react';
import { Animated, Image, Dimensions, View, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const windowWidth = Dimensions.get('window').width;

const API_KEY = "***REMOVED***"; // Flicker API Key Generated using https://www.flickr.com/services/api/
const USER_ID = "143848472@N03"; // Flicker User for SHPE 


const FlickrPhotoItem = memo(({ item }: { item: FlickrPhoto }) => {
    if (!item) return null;

    const photoUrl = `https://live.staticflickr.com/${item.server}/${item.id}_${item.secret}_w.jpg`;
    return (
        <View style={{ width: windowWidth }}>
            <LinearGradient
                className='absolute top-0 left-0 bottom-0 right-0'
                colors={['#ffffff', '#72A9BE']}
            />
            <View className="mt-5 pb-4 ml-7">
                <Image source={{ uri: photoUrl }} className="h-40 w-[92%] rounded-3xl" />
            </View>
        </View>
    );
});

const FlickrPhotoGallery = () => {
    const [currentIndex, setCurrentIndex] = useState(1);
    const [photos, setPhotos] = useState<FlickrPhoto[]>([]);
    const photoListRef = useRef<Animated.FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slideInterval = useRef<NodeJS.Timeout>();

    const shufflePhotos = (array: FlickrPhoto[]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    const fetchPhotos = async () => {
        try {
            const response = await fetch(`https://www.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&api_key=${API_KEY}&user_id=${USER_ID}&format=json&nojsoncallback=1`);
            const json = await response.json();
            const shuffledPhotos = shufflePhotos(json.photos.photo);
            setPhotos([shuffledPhotos[shuffledPhotos.length - 1], ...shuffledPhotos, shuffledPhotos[0]]);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchPhotos();
    }, []);

    const resetAndStartAutoSlide = () => {
        if (slideInterval.current) {
            clearInterval(slideInterval.current);
        }
        slideInterval.current = setInterval(() => {
            setCurrentIndex(prevIndex => {
                let nextIndex = prevIndex + 1;
                if (nextIndex >= photos.length) {
                    photoListRef.current?.scrollToIndex({ animated: false, index: 1 });
                    nextIndex = 1;
                } else {
                    photoListRef.current?.scrollToIndex({ animated: true, index: nextIndex });
                }
                return nextIndex;
            });
        }, 3000); // Change slide every 3 seconds
    };

    const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const contentOffset = e.nativeEvent.contentOffset.x;
        const newIndex = Math.floor(contentOffset / windowWidth);

        if (newIndex === 0) {
            // Jump to the last real slide
            photoListRef.current?.scrollToIndex({ animated: false, index: photos.length - 2 });
            setCurrentIndex(photos.length - 2);
        } else if (newIndex === photos.length - 1) {
            // Jump to the first real slide
            photoListRef.current?.scrollToIndex({ animated: false, index: 1 });
            setCurrentIndex(1);
        } else {
            setCurrentIndex(newIndex);
        }

        // Reset and restart the auto-slide interval
        resetAndStartAutoSlide();
    };

    useEffect(() => {
        resetAndStartAutoSlide();
        return () => clearInterval(slideInterval.current!);
    }, [photos]);

    const getItemLayout = (_: any, index: number) => ({
        length: windowWidth,
        offset: windowWidth * index,
        index,
    });

    const renderItem = ({ item }: { item: FlickrPhoto }) => <FlickrPhotoItem item={item} />;

    return (
        <Animated.FlatList
            data={photos}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false }
            )}
            onMomentumScrollEnd={onScrollEnd}
            getItemLayout={getItemLayout}
            ref={photoListRef}
        />
    );
};

interface FlickrPhoto {
    id: string;
    secret: string;
    server: string;
}

export default FlickrPhotoGallery;
