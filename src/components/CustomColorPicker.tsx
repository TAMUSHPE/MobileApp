import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput } from 'react-native';
import ColorPicker, {
  Panel3,
  colorKit,
  SaturationSlider,
  Preview,
} from 'reanimated-color-picker';

export default function CustomColorPicker({ onColorChosen }: CustomColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const customSwatches = new Array(6).fill('#fff').map(() => colorKit.randomRgbColor().hex());
  const [selectedColor, setSelectedColor] = useState(customSwatches[0]);
  const [hexInput, setHexInput] = useState(customSwatches[0]);

  const onColorSelect = (color: any) => {
    setSelectedColor(color.hex);
    setHexInput(color.hex);
  };

  const handleHexInputChange = (hex: string) => {
    setHexInput(hex);
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      setSelectedColor(hex);
    }
  };

  const handleClose = () => {
    setShowPicker(false);
    onColorChosen(selectedColor);
  };

  useEffect(() => {
    onColorChosen(selectedColor);
  }, []);


  const isColorLight = (colorHex: string) => {
    const hex = colorHex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
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
            <Text style={styles.modalTitle}>Select a Color Committee</Text>
            <TextInput
              style={styles.hexInput}
              onChangeText={handleHexInputChange}
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
  closeButton: {
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 10,
  },
  previewContainer: {
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#bebdbe',
  },
  previewStyle: {
    height: 40,
    borderRadius: 14,
  },
});
