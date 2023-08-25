import { View, Text, Touchable, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState } from 'react'
import { getCommitteeInfo, setCommitteeInfo } from '../api/firebaseUtils'
import { TouchableOpacity } from 'react-native-gesture-handler';

const CommitteesEditor = () => {
    const [description, setDescription] = useState<string>();
    const [headUID, setHeadUID] = useState<string>();
    const [leadUIDs, setLeadUIDs] = useState<string[]>([]);
    const [newLeadUID, setNewLeadUID] = useState<string>("");
    const [memberApplicationLink, setMemberApplicationLink] = useState<string>();
    const [leadApplicationLink, setLeadApplicationLink] = useState<string>();
    const [committeeName, setCommitteeName] = useState<string>("");

    const clearData = () => {
        setDescription("");
        setHeadUID("");
        setLeadUIDs([]);
        setNewLeadUID("");
        setMemberApplicationLink("");
        setLeadApplicationLink("");
        setCommitteeName("");
    }

    const updateCommitteeInfo = async () => {
        if (committeeName === "") {
            return
        }

        setCommitteeInfo(committeeName, {
            description: description,
            headUID: headUID,
            leadUIDs: leadUIDs,
            memberApplicationLink: memberApplicationLink,
            leadApplicationLink: leadApplicationLink,
        })
            .then((result) => {
                if (result) {
                    console.log("Data successfully written!");
                } else {
                    console.log("An error occurred.");
                }
            });

        clearData();
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className='justify-center items-center h-[60%] mt-20 space-y-4'>

            <TextInput
                value={committeeName}
                placeholder='Committee Name'
                onChangeText={setCommitteeName}
                className='border-2 border-black rounded-md p-2'
            />
            <TextInput
                value={description}
                placeholder='Description'
                onChangeText={setDescription}
                className='border-2 border-black rounded-md p-2'
            />

            <TextInput
                value={memberApplicationLink}
                placeholder='Member Application Link'
                onChangeText={setMemberApplicationLink}
                className='border-2 border-black rounded-md p-2'
            />
            <TextInput
                value={leadApplicationLink}
                placeholder='Lead Application Link'
                onChangeText={setLeadApplicationLink}
                className='border-2 border-black rounded-md p-2'
            />

            <TextInput
                value={headUID}
                placeholder='Head UID'
                onChangeText={setHeadUID}
                className='border-2 border-black rounded-md p-2'
            />
            <TextInput
                value={newLeadUID}
                placeholder='Lead UIDs'
                onChangeText={setNewLeadUID}
                className='border-2 border-black rounded-md p-2'
            />

            <TouchableOpacity
                onPress={() => updateCommitteeInfo()}
                className='bg-blue-500 rounded-md p-2'
            >
                <Text>Update</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    )
}

export default CommitteesEditor