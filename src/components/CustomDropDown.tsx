import { View, Text, TouchableOpacity, TextInput, FlatList, Animated, Touchable, } from 'react-native';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Octicons } from '@expo/vector-icons';

const SimpleDropDown = forwardRef(({ data, onSelect, isOpen, searchKey, onToggle, label, title, selectedItemProp, disableSearch, displayType = "both", containerClassName = "", dropDownClassName = "" }: {
    data: Item[];
    onSelect: (item: Item) => void;
    searchKey: string;
    isOpen: boolean;
    onToggle: () => void;
    label: string;
    title?: string;
    selectedItemProp?: SelectedItem | null;
    disableSearch?: boolean;
    className?: string;
    displayType?: string;
    containerClassName?: string;
    dropDownClassName?: string;
}, ref) => {
    const [search, setSearch] = useState('');
    const [filteredData, setFilteredData] = useState(data);
    const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)
    const searchRef = useRef<TextInput>(null);
    const moveTitle = useRef(new Animated.Value(0)).current;

    const titleStartY = -5;
    const titleEndY = 20;

    useEffect(() => {
        if (selectedItem && selectedItem.value != "") {
            moveTitleTop();
        } else {
            moveTitleBottom();
        }
    }, [selectedItem]);

    useEffect(() => {
        if (selectedItemProp && selectedItemProp?.value != "")
            setSelectedItem(selectedItemProp);
    }, [selectedItemProp]);

    const moveTitleTop = () => {
        Animated.timing(moveTitle, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
        }).start();
    };

    const moveTitleBottom = () => {
        Animated.timing(moveTitle, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
        }).start();
    }

    const yVal = moveTitle.interpolate({
        inputRange: [0, 1],
        outputRange: [titleStartY, titleEndY]
    });

    useEffect(() => {
        setFilteredData(data);
    }, [data]);

    const onSearch = (searchText: string) => {
        if (searchText !== '') {
            const tempData = data.filter(item =>
                (item.major && item.major.toLowerCase().includes(searchText.toLowerCase())) ||
                (item.iso && item.iso.toLowerCase().includes(searchText.toLowerCase()))
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
        onSelect(newItem.iso ? newItem : item);
        setSearch('');
    };

    const getDisplayText = () => {
        if (selectedItem && selectedItem.value != "") {
            switch (displayType) {
                case 'iso':
                    return selectedItem?.iso || label;
                case 'value':
                    return selectedItem?.value || label;
                case 'both':
                    return selectedItem ? `${selectedItem.iso ? `${selectedItem.iso} - ` : ''}${selectedItem.value}` : label;
                default:
                    return label;
            }
        } else {
            return label;
        }
    };

    const getItemDisplayText = (item: Item) => {
        switch (displayType) {
            case 'iso':
                return item.iso ? `${item.iso}` : '';
            case 'value':
                return String(item[searchKey]);
            case 'both':
                return `${item.iso ? `${item.iso} - ` : ''}${String(item[searchKey])}`;
            default:
                return String(item[searchKey]);
        }
    };

    const clearSelection = () => {
        setSelectedItem(null); // Reset selectedItem to null
        setSearch(''); // Reset search text if needed
        onSearch(''); // Reset filteredData if needed
        onSelect({}); // Reset selected item
    };

    useImperativeHandle(ref, () => ({
        clearSelection,
    }));

    return (
        <View className={'flex-1 ' + containerClassName}>
            <View>
                {title && (
                    <Animated.Text className="w-[90%] items-center self-center text-black font-semibold text-lg" style={{ transform: [{ translateY: yVal }] }}>
                        {title}
                    </Animated.Text>
                )}
                <TouchableOpacity
                    className='flex-row justify-between items-center self-center bg-white rounded-md w-[100%] h-12 px-3 border-gray-500 border'
                    activeOpacity={1}
                    onPress={() => onToggle()}>

                    <Text style={{ fontWeight: '600' }}>
                        {getDisplayText()}
                    </Text>
                </TouchableOpacity>

                {selectedItem && selectedItem.value != "" && ref && (
                    <TouchableOpacity
                        className='absolute top-0 right-0 h-12 w-12 flex items-center justify-center'
                        onPress={() => clearSelection()}
                    >
                        <Octicons name="x" size={24} color="red" />
                    </TouchableOpacity>
                )}
            </View>
            {isOpen ? (
                <View className={"absolute top-14 self-center bg-white rounded-md h-72 w-[100%] border-gray-500 border px-1 " + dropDownClassName}>
                    {!disableSearch && (
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
                    )}

                    <FlatList
                        className='mt-4'
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
                                        {getItemDisplayText(item)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            ) : null}
        </View>
    );
});

interface Item {
    [key: string]: any;
    iso?: string;
}

interface SelectedItem {
    value?: string;
    iso?: string;
}

export default SimpleDropDown;