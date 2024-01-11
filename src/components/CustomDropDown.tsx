import { View, Text, TouchableOpacity, TextInput, FlatList, Animated, TouchableWithoutFeedback, Dimensions, LayoutChangeEvent, LayoutRectangle } from 'react-native';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Octicons } from '@expo/vector-icons';


/**
 * CustomDropDownMenu is a React component that renders a dropdown menu with search and selection capabilities.
 * It supports dynamic rendering, search filtering, and clear selection functionality.
 * 
 * The component requires 'data' to be an array of objects with a structure like { iso: string, [searchKey]: string },
 * where 'searchKey' is the key used for searching items. The 'onToggle' function and 'isOpen' boolean are used to control 
 * the visibility of the dropdown, allowing the parent component to manage dropdown visibility and toggle off other dropdown menus.
 * The 'ref' is used to access the 'clearSelection' method from the parent component, enabling external control over the dropdown's selection.
 * Entering a 'title' will display a floating-title above the dropdown menu after a selection has been made.
 *
 * @param {Item[]} data - The array of items to display in the dropdown.
 * @param {function} onSelect - The callback function to execute when an item is selected.
 * @param {string} searchKey - The key to be used for searching items.
 * @param {string} label - Default label to be shown when no item is selected.
 * @param {function} onToggle - Function to toggle the dropdown open/closed.
 * @param {boolean} isOpen - Boolean to control the visibility of the dropdown.
 * @param {Object} ref - Ref object for parent component to access child methods.
 * @param {SelectedItem} [selectedItemProp] - The currently selected item.
 * @param {string} [title] - Optional title for the dropdown.
 * @param {boolean} [disableSearch] - If true, disables the search functionality.
 * @param {string} [displayType="both"] - Defines how to display items ('iso', 'value', or 'both').
 * @param {string} [containerClassName=""] - Additional class name for the container.
 * @param {string} [dropDownClassName=""] - Additional class name for the dropdown.
 * @param {string} [textClassName=""] - Additional class name for the text elements.
 * @returns {React.ReactElement} The CustomDropDownMenu component.
 */
const CustomDropDownMenu = forwardRef(({ data, onSelect, isOpen, searchKey, onToggle, label, title, selectedItemProp, disableSearch, displayType = "both", containerClassName = "", dropDownClassName = "", textClassName = "" }: {
    data: Item[];
    onSelect: (item: Item) => void;
    searchKey: string;
    isOpen: boolean;
    onToggle: () => void;
    label: string;
    title?: string;
    selectedItemProp?: SelectedItem | null;
    disableSearch?: boolean;
    displayType?: string;
    containerClassName?: string;
    dropDownClassName?: string;
    textClassName?: string;
}, ref) => {
    const [search, setSearch] = useState('');
    const [filteredData, setFilteredData] = useState(data);
    const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)
    const searchRef = useRef<TextInput>(null);
    const moveTitle = useRef(new Animated.Value(0)).current;
    const [componentLayout, setComponentLayout] = useState<LayoutRectangle | null>(null);

    const titleStartY = 20;
    const titleEndY = -5;

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

    const onComponentLayout = (event: LayoutChangeEvent) => {
        setComponentLayout(event.nativeEvent.layout);
    };

    let overlayStyle = {};
    if (componentLayout) {
        const screenHeight = Dimensions.get('window').height;
        const screenWidth = Dimensions.get('window').width;

        overlayStyle = {
            position: 'absolute',
            left: -componentLayout.x - 16, // adjustment in x position to fill screen
            top: -componentLayout.y - 180, // adjustment in y position to fill screen
            width: screenWidth,
            height: screenHeight,
            backgroundColor: 'rgba(0, 0, 255, 0.6)'
        };
    }

    return (
        <View className={'flex-1 ' + containerClassName} onLayout={onComponentLayout}>
            <View>
                {isOpen && (
                    <TouchableWithoutFeedback onPress={onToggle}>
                        <View style={overlayStyle} />
                    </TouchableWithoutFeedback>
                )}
                {title && (
                    <Animated.Text className="w-[100%] ml-3 items-center self-center border-gray-400 font-semibold text-lg text-white" style={{ transform: [{ translateY: yVal }] }}>
                        {title}
                    </Animated.Text>
                )}
                <TouchableOpacity
                    className='flex-row justify-between items-center self-center bg-white rounded-md w-[100%] h-12 px-3 border-gray-400 border'
                    activeOpacity={1}
                    onPress={() => onToggle()}>

                    <Text className={'font-bold text-gray-400 text-xl ' + textClassName}>
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
                <View className={"absolute top-14 self-center bg-white rounded-md h-72 w-[100%] border-gray-400 border px-1 " + dropDownClassName}>
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
                                    onPress={() => handleSelect(item)}
                                    className='w-[85%] self-center h-12 justify-center border-b border-b-gray-400'
                                    key={index}
                                >
                                    <Text className='text-lg font-semibold'>
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

export interface CustomDropDownMethods {
    clearSelection: () => void;
}

export default CustomDropDownMenu;