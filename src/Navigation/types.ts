
import { NativeStackScreenProps } from "@react-navigation/native-stack";

export type MainStackNavigatorParamList = {
    Home: undefined;
    Test: undefined;
    Resources: undefined;
    Settings: {
        userId: number;
    };
}

export type DrawerNavigatorParamList = {
    HomeStack: MainStackNavigatorParamList;
    Feed: undefined;
    Test: undefined;
}

export type HomeProps = NativeStackScreenProps<MainStackNavigatorParamList, "Home">;
export type SettingsProps = NativeStackScreenProps<MainStackNavigatorParamList, "Settings">;

export type FeedProps = NativeStackScreenProps<DrawerNavigatorParamList, "Feed">;
export type TestProps = NativeStackScreenProps<DrawerNavigatorParamList, "Test">;