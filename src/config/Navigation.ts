
import { NativeStackScreenProps } from "@react-navigation/native-stack";

export type RootStackParamList = {
    Home: undefined;
    Test: undefined;
}

export type HomeProps = NativeStackScreenProps<RootStackParamList, "Home">;
export type TestProps = NativeStackScreenProps<RootStackParamList, "Test">;

