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
            <TouchableOpacity
                onPress={() => setVisible(false)}
                className="h-[100%] w-[100%]"
                style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            >
                <View className='items-center justify-center h-full'>
                    <TouchableWithoutFeedback>
                        {children}
                    </TouchableWithoutFeedback>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default DismissibleModal;
