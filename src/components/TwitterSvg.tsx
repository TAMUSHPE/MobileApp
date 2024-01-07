import * as React from "react"
import Svg, { Path, Rect } from "react-native-svg"

const TwitterSvg = ({ size = 20, color = "#1d9bf0", ...props }) => (
    <Svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 22 22"
        width={size}
        height={size}
        {...props}
    >
        <Rect x="4" y="4" width={size - 8} height={size - 8} rx={5} fill="white" />
        <Path
            fill={color}
            d="M20.396 11a3.487 3.487 0 0 0-2.008-3.062 3.474 3.474 0 0 0-.742-3.584 3.474 3.474 0 0 0-3.584-.742A3.468 3.468 0 0 0 11 1.604a3.463 3.463 0 0 0-3.053 2.008 3.472 3.472 0 0 0-1.902-.14c-.635.13-1.22.436-1.69.882a3.461 3.461 0 0 0-.734 3.584A3.49 3.49 0 0 0 1.604 11a3.496 3.496 0 0 0 2.017 3.062 3.471 3.471 0 0 0 .733 3.584 3.49 3.49 0 0 0 3.584.742A3.487 3.487 0 0 0 11 20.396a3.476 3.476 0 0 0 3.062-2.007 3.335 3.335 0 0 0 4.326-4.327A3.487 3.487 0 0 0 20.396 11zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
        />
    </Svg>
)
export default TwitterSvg