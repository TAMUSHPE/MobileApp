import { cssInterop } from "nativewind";
import MapView, { Circle, Marker } from "react-native-maps";

cssInterop(MapView, { className: "style" });
cssInterop(Marker, { className: "style" });
cssInterop(Circle, { className: "style" });
