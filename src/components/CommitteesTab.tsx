import { View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import CommitteesInfo from './CommitteesInfo'
import CommitteesSlider from './CommitteesSlider'
import { Committee } from '../types/Committees'
import { CommitteesInfoProp } from '../types/Navigation'
import { useIsFocused } from '@react-navigation/core'

const CommitteesTab: React.FC<CommitteesInfoProp> = ({ navigation }) => {
    const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null) // depending on user committe get default committee

    // This reset the selected committee when user switch off the tab
    const isFocused = useIsFocused();
    const handleFocus = useCallback(() => {
        setSelectedCommittee(null);
    }, [setSelectedCommittee]);

    useEffect(() => {
        if (isFocused) {
            handleFocus();
        }
    }, [isFocused, handleFocus]);


    return (
        <View>
            <CommitteesSlider onCommitteeSelected={setSelectedCommittee} selectedCommittee={selectedCommittee} />
        </View>
    )
}

export default CommitteesTab