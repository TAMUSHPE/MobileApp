import { View, Text, TouchableOpacity, Image, TextInput, FlatList, Animated, } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Octicons } from '@expo/vector-icons';

const SimpleDropDown = ({ data, onSelect, searchKey, isOpen, onToggle, label, title }: SimpleDropDownProps) => {
    const [search, setSearch] = useState('');
    const [filteredData, setFilteredData] = useState(data);
    const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)
    const searchRef = useRef<TextInput>(null);
    const moveTitle = useRef(new Animated.Value(0)).current;

    const titleStartY = 20;
    const titleEndY = -5;

    useEffect(() => {
        if (selectedItem?.value) {
            moveTitleTop();
        }
    }, [selectedItem]);

    const moveTitleTop = () => {
        Animated.timing(moveTitle, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
        }).start();
    };

    const yVal = moveTitle.interpolate({
        inputRange: [0, 1],
        outputRange: [titleStartY ?? 20, titleEndY ?? 0]
    });

    useEffect(() => {
        setFilteredData(data);
    }, [data]);

    const onSearch = (searchText: string) => {
        if (searchText !== '') {
            const tempData = data.filter(item =>
                item[searchKey] && String(item[searchKey]).toLowerCase().includes(searchText.toLowerCase())
            );
            setFilteredData(tempData);
        } else {
            setFilteredData(data);
        }
    };

    const handleSelect = (item: Item) => {
        const newItem: SelectedItem = {
            value: String(item[searchKey]),
            iso: item.iso
        };
        setSelectedItem(newItem);
        onToggle();
        onSelect(item);
        setSearch('');
    };

    return (
        <View>

            <View>
                <Animated.Text className="w-[90%] items-center self-center pl-1" style={{ minWidth: "90%", fontWeight: '600', color: "#fff", transform: [{ translateY: yVal }] }}>
                    {title}
                </Animated.Text>
                <TouchableOpacity
                    className='flex-row justify-between items-center self-center px-4 bg-white rounded-md w-[90%] h-14'
                    activeOpacity={1}
                    onPress={() => onToggle()}>

                    <Text style={{ fontWeight: '600' }}>
                        {selectedItem ? (selectedItem.iso ? `${selectedItem.iso} - ` : '') + selectedItem.value : label}
                    </Text>

                    {isOpen ? (
                        <Octicons name="chevron-up" size={24} color="black" />
                    ) : (
                        <Octicons name="chevron-down" size={24} color="black" />
                    )}
                </TouchableOpacity>
            </View>
            {isOpen ? (
                <View className="self-center bg-white w-[90%] rounded-md mt-4 h-72">
                    <TextInput
                        placeholder="Search.."
                        value={search}
                        ref={searchRef}
                        onChangeText={txt => {
                            onSearch(txt);
                            setSearch(txt);
                        }}
                        className='w-[90%] h-12 self-center mt-6 pl-3 rounded-md border-gray-400 border'
                    />

                    <FlatList
                        data={filteredData}
                        renderItem={({ item, index }) => {
                            return (
                                <TouchableOpacity
                                    style={{
                                        width: '85%',
                                        alignSelf: 'center',
                                        height: 50,
                                        justifyContent: 'center',
                                        borderBottomWidth: 0.5,
                                        borderColor: '#8e8e8e',
                                    }}
                                    onPress={() => handleSelect(item)}
                                >
                                    <Text style={{ fontWeight: '600' }}>
                                        {item.iso ? `${item.iso} - ` : ''}{String(item[searchKey])}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            ) : null}
        </View>
    );
};

interface Item {
    [key: string]: any;
    iso?: string;
}

interface SelectedItem {
    value: string;
    iso?: string;
}

interface SimpleDropDownProps {
    data: Item[];
    onSelect: (item: Item) => void;
    searchKey: string;
    isOpen: boolean;
    onToggle: () => void;
    label: string;
    title: string;
}
export default SimpleDropDown;