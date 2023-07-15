import { View, Text, ScrollView, Image, FlatList } from 'react-native';
import React, { useState, useRef } from 'react';
import { Images } from '../../assets';
import { LinearGradient } from 'expo-linear-gradient';
import HighLightSliderItem from './HighLightSliderItem';
import { slides } from './slides'

const HighlightSlider = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    return (
        <View
            className='mt-4'
        >
            <LinearGradient
                className='absolute top-0 left-0 bottom-0 right-0'
                colors={['#191740', '#72A9BE']}
            />

            <FlatList
                data={slides}
                renderItem={({ item }) => <HighLightSliderItem item={item} />}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
            />


        </View>
    )
}

export default HighlightSlider;
