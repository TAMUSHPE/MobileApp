import { View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState } from 'react'
import { getCommitteeInfo, setCommitteeInfo } from '../api/firebaseUtils'
import { TouchableOpacity } from 'react-native-gesture-handler';
import DropDownPicker from 'react-native-dropdown-picker';
import { CommitteeConstants } from '../types/Committees';

const CommitteesEditor = () => {
    const [openCommitteeNameDropMenu, setOpenCommitteeNameDropMenu] = useState<boolean>(false);
    const [committeeName, setCommitteeName] = useState<string | null>(null);
    const [committeeNames, setCommitteeNames] = useState([
        { label: "Technical Affairs", value: CommitteeConstants.TECHNICALAFFAIRS },
        { label: "Public Relations", value: CommitteeConstants.PUBLICRELATIONS },
        { label: "MentorSHPE", value: CommitteeConstants.MENTORSHPE },
        { label: "Scholastic", value: CommitteeConstants.SCHOLASTIC },
        { label: "SHPEtinas", value: CommitteeConstants.SHPETINAS },
        { label: "Secretary", value: CommitteeConstants.SECRETARY },
        { label: "Internal Affairs", value: CommitteeConstants.INTERNALAFFAIRS },
        { label: "Treasurer", value: CommitteeConstants.TREASURER },

    ]);
    const [description, setDescription] = useState<string | null>(null);
    const [headUID, setHeadUID] = useState<string | null>(null);
    const [leadUIDs, setLeadUIDs] = useState<string[] | null>(null);
    const [newLeadUID, setNewLeadUID] = useState<string | null>(null);
    const [memberApplicationLink, setMemberApplicationLink] = useState<string | null>(null);
    const [leadApplicationLink, setLeadApplicationLink] = useState<string | null>(null);

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
        if (!committeeName) {
            return
        }

        // currently if something is not inputted then it will be default
        // this will be changed later
        setCommitteeInfo(committeeName, {
            description: description ?? "",
            headUID: headUID ?? "",
            leadUIDs: leadUIDs ?? [],
            memberApplicationLink: memberApplicationLink ?? "",
            leadApplicationLink: leadApplicationLink ?? "",
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
            <View className="flex-row space-x-4">
                <View className="w-28">
                    <DropDownPicker
                        dropDownDirection="TOP"
                        open={openCommitteeNameDropMenu}
                        value={committeeName}
                        items={committeeNames}
                        setOpen={setOpenCommitteeNameDropMenu}
                        setValue={setCommitteeName}
                        setItems={setCommitteeNames}
                    />
                </View>
                <TextInput
                    value={description ?? ""}
                    placeholder='Description'
                    onChangeText={setDescription}
                    className='border-2 border-black rounded-md p-2'
                />

                <TextInput
                    value={memberApplicationLink ?? ""}
                    placeholder='Member Application Link'
                    onChangeText={setMemberApplicationLink}
                    className='border-2 border-black rounded-md p-2'
                />
            </View>
            <View className="flex-row space-x-4">
                <TextInput
                    value={leadApplicationLink ?? ""}
                    placeholder='Lead Application Link'
                    onChangeText={setLeadApplicationLink}
                    className='border-2 border-black rounded-md p-2'
                />

                <TextInput
                    value={headUID ?? ""}
                    placeholder='Head UID'
                    onChangeText={setHeadUID}
                    className='border-2 border-black rounded-md p-2'
                />
                <TextInput
                    value={newLeadUID ?? ""}
                    placeholder='Lead UIDs'
                    onChangeText={setNewLeadUID}
                    className='border-2 border-black rounded-md p-2'
                />
            </View>

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