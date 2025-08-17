import { Image } from 'react-native';
import { Images } from '../../assets';

export default function ShpetinasPng({ width = 100, height = 100 }) {
    return (
        <Image
            source={Images.SHPETINAS_PNG}
            style={{ width, height, resizeMode: "contain" }}
        />
    );
}