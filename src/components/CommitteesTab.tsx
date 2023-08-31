import { View, Text } from 'react-native'
import React, { useState } from 'react'
import CommitteesInfo from './CommitteesInfo'
import CommitteesSlider from './CommitteesSlider'
import { Committee } from '../types/Committees'

const CommitteesTab = () => {
    const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null) // depending on user committe get default committee

    return (
        <View>
            <CommitteesSlider onCommitteeSelected={setSelectedCommittee} selectedCommittee={selectedCommittee} />
            <CommitteesInfo selectedCommittee={selectedCommittee} />
        </View>
    )
}

export default CommitteesTab