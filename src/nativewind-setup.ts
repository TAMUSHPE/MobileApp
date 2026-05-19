import { cssInterop } from "nativewind";
import { Animated } from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "@pietile-native-kit/keyboard-aware-scrollview";
import Svg from "react-native-svg";

cssInterop(MapView, { className: "style" });
cssInterop(Marker, { className: "style" });
cssInterop(Circle, { className: "style" });

cssInterop(Animated.View, { className: "style" });
cssInterop(Animated.Text, { className: "style" });

cssInterop(LinearGradient, { className: "style" });
cssInterop(SafeAreaView, { className: "style" });
cssInterop(KeyboardAwareScrollView, {
    className: "style",
    contentContainerClassName: "contentContainerStyle",
});
cssInterop(Svg, { className: "style" });
