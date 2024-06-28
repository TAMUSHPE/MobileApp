import { Animated, Image, Dimensions, View, NativeScrollEvent, NativeSyntheticEvent, useColorScheme } from 'react-native';
import React, { useEffect, useState, useRef, memo, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { Images } from '../../assets';

const windowWidth = Dimensions.get('window').width;


const FlickrPhotoGallery = () => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [currentIndex, setCurrentIndex] = useState(1);
    const [photos, setPhotos] = useState<(FlickrPhoto | null)[]>([]);
    const [photosFetched, setPhotosFetched] = useState(false); // Add this flag
    const photoListRef = useRef<Animated.FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slideInterval = useRef<NodeJS.Timeout>();

    const flickerApiKey = process.env.FLICKER_API_KEY;
    const flickerUserId = "143848472@N03";
    const flickrPhotoSetId = '72177720316068498';


    const shufflePhotos = (array: FlickrPhoto[]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    const fetchPhotos = async () => {
        try {
            const url = `https://www.flickr.com/services/rest/?method=flickr.photosets.getPhotos&api_key=${flickerApiKey}&user_id=${flickerUserId}&photoset_id=${flickrPhotoSetId}&format=json&nojsoncallback=1`;

            const response = await fetch(url);
            const json = await response.json();

            if (json && json.photoset && json.photoset.photo.length > 0) {
                const shuffledPhotos = shufflePhotos(json.photoset.photo);
                setPhotos([shuffledPhotos[shuffledPhotos.length - 1], ...shuffledPhotos, shuffledPhotos[0]]);
                setPhotosFetched(true); // Set the flag to true
            } else {
                setPhotos([null]); // Add a null item to trigger the default image
                setPhotosFetched(false); // Ensure flag is false if no photos
            }
        } catch (error) {
            setPhotos([null]); // Add a null item to trigger the default image
            setPhotosFetched(false); // Ensure flag is false if error
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
                    if (photos.length > 2) {
                        photoListRef.current?.scrollToIndex({ animated: false, index: 1 });
                    }
                    nextIndex = 1;
                } else {
                    photoListRef.current?.scrollToIndex({ animated: true, index: nextIndex });
                }
                return nextIndex;
            });
        }, 7000); // Change slide every 7 seconds
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
        if (photos.length > 2) {
            photoListRef.current?.scrollToIndex({ animated: false, index: 1 });
            resetAndStartAutoSlide();
        }
        return () => clearInterval(slideInterval.current!);
    }, [photos]);

    const getItemLayout = (_: any, index: number) => ({
        length: windowWidth,
        offset: windowWidth * index,
        index,
    });

    const FlickrPhotoItem = memo(({ item }: { item: FlickrPhoto | null }) => {
        const photoUrl = item ? `https://live.staticflickr.com/${item.server}/${item.id}_${item.secret}_w.jpg` : null;
        return (
            <View style={{ width: windowWidth }}>
                <View className="mt-5 mx-4">
                    <Image
                        source={photoUrl ? { uri: photoUrl } : darkMode ? Images.SHPE_WHITE : Images.SHPE_NAVY}
                        className="h-40 rounded-2xl"
                    />
                </View>
            </View>
        );
    });

    const renderItem = ({ item }: { item: FlickrPhoto | null }) => <FlickrPhotoItem item={item} />;

    if (!photosFetched) {
        return (
            <View style={{ width: windowWidth }}>
                <View className="mt-5 mx-4">
                    <Image
                        resizeMode='contain'
                        source={darkMode ? Images.SHPE_WHITE : Images.SHPE_NAVY}
                        className="h-40 rounded-2xl" />
                </View>
            </View>
        );
    }

    return (
        <Animated.FlatList
            data={photos}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item ? item.id : 'default'} - ${index}`}
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
