import { FunctionComponent } from "react";
import { View } from "react-native";


const ProgressBar: FunctionComponent = () =>
{
    return (
        <View style = {style.barContainer}>
            <View style = {style.progressBar} />
        </View>
    );
};

const style = StyleSheet.create ({
    barContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    progressBar: {
        backgroundcolor: 'blue',
        width: 100,
        height: 100,
    },
});

export default ProgressBar;