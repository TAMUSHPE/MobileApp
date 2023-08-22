import { View, Text } from 'react-native'
import React from 'react'
import CommitteesInfo from './CommitteesInfo'
import CommitteesSlider from './CommitteesSlider'

const CommitteesTab = () => {
    /**
     * Data:
     * The UID for each committee head
     * The UIDs for each committee lead
     * Member Application Link
     * Lead Application Link
     * 
     * Firebase Actions:
     * Committee Head/Lead Assignment
     * Set Member/Lead Application Link
     * Discription of committee editable by head
     * Any other content editable by head
     */
    return (
        <View>
            <CommitteesSlider />
            <CommitteesInfo />
        </View>
    )
}

export default CommitteesTab