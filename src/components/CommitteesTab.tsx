import { View, Text } from 'react-native'
import React, { useState } from 'react'
import CommitteesInfo from './CommitteesInfo'
import CommitteesSlider from './CommitteesSlider'
import { Committee } from '../types/Committees'
import { CommitteesInfoProp } from '../types/Navigation'

const CommitteesTab: React.FC<CommitteesInfoProp> = ({ navigation }) => {
    const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null) // depending on user committe get default committee

    return (
        <View>
            <CommitteesSlider onCommitteeSelected={setSelectedCommittee} selectedCommittee={selectedCommittee} />
            <CommitteesInfo selectedCommittee={selectedCommittee} navigation={navigation} />
        </View>
    )
}

export default CommitteesTab