/// <reference types="nativewind/types" />

declare module '*.svg' {
    import React = require('react');
    const SVG: React.FC<React.SVGProps<SVGSVGElement>>;
    export default SVG;
}