import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { ResourcesProps } from '../types/Navigation'

const ResourceItem: React.FC<ResourcesProps> = ({ title, screen, image, navigation }) => {
    return (
        <View>
            <Text>{title} </Text>
            <TouchableOpacity
                onPress={() => navigation.navigate(screen)}
            >
                <Text>Go to {screen}</Text>
            </TouchableOpacity>
        </View>
    )
}

export default ResourceItem