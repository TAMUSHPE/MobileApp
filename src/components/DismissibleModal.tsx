import React, { ReactNode } from 'react';
import { Modal, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const DismissibleModal = ({ visible, setVisible, children }: {
    visible: boolean;
    setVisible: (visible: boolean) => void;
    children: ReactNode;
}) => {
    return (
        <Modal
            animationType="none"
            transparent={true}
            visible={visible}
            onRequestClose={() => setVisible(false)}
        >
            <TouchableWithoutFeedback
                onPress={() => setVisible(false)}
            >
                <View className='items-center justify-center h-[100%] w-[100%] bg-[#0000009b]'>
                    <TouchableWithoutFeedback>
                        {children}
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

export default DismissibleModal;
