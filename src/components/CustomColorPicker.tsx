import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput } from 'react-native';
import ColorPicker, { Panel3, colorKit, SaturationSlider } from 'reanimated-color-picker';
import { calculateHexLuminosity, validateHexColor } from '../helpers/colorUtils';

export default function CustomColorPicker({ onColorChosen, initialColor = "#500000" }: CustomColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [hexInput, setHexInput] = useState(initialColor);

  const onColorSelect = (color: any) => {
    setSelectedColor(color.hex);
    setHexInput(color.hex);
  };


  const handleClose = () => {
    setShowPicker(false);
    onColorChosen(selectedColor);
  };

  useEffect(() => {
    onColorChosen(selectedColor);
  }, []);


  const isColorLight = (colorHex: string) => {
    const luminosity = calculateHexLuminosity(colorHex);
    return luminosity > 155;
  };
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setShowPicker(true)}>
        <View style={[styles.openButton, { backgroundColor: selectedColor }]}>
          <Text style={[styles.buttonText, { color: isColorLight(selectedColor) ? '#000' : '#fff' }]}>
            Select a Color
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent={true}
        onRequestClose={() => handleClose()}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerPopup}>
            <Text style={styles.modalTitle}>Select a Color</Text>
            <TextInput
              style={styles.hexInput}
              onChangeText={(text) => {
                setHexInput(text);
                if (validateHexColor(text)) {
                  setSelectedColor(text);
                }
              }}
              value={hexInput}
              placeholder="Enter Hex Code"
              autoCapitalize="characters"
              maxLength={7}
            />
            <ColorPicker
              value={selectedColor}
              sliderThickness={25}
              thumbShape="circle"
              thumbSize={25}
              onChange={onColorSelect}
              adaptSpectrum>
              <Panel3 style={styles.panelStyle} centerChannel="brightness" />
              <SaturationSlider style={styles.sliderStyle} />
            </ColorPicker>
            <TouchableOpacity
              style={styles.openButton}
              onPress={() => handleClose()}
            >
              <View style={[styles.openButton, { backgroundColor: selectedColor }]}>
                <Text style={[styles.buttonText, { color: isColorLight(selectedColor) ? '#000' : '#fff' }]}>
                  Close
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

type CustomColorPickerProps = {
  onColorChosen: (color: string) => void;
  initialColor?: string;
};

const styles = StyleSheet.create({
  hexInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: '100%',
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerPopup: {
    width: 300,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    elevation: 10,
  },
  panelStyle: {
    borderRadius: 16,
    elevation: 5,
  },
  sliderStyle: {
    borderRadius: 20,
    marginTop: 20,
    elevation: 5,
  },
  openButton: {
    width: '100%',
    borderRadius: 20,
    paddingHorizontal: 40,
    paddingVertical: 10,
    marginTop: 10,
    backgroundColor: '#fff',
    elevation: 5,
  },
  buttonText: {
    color: '#707070',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
