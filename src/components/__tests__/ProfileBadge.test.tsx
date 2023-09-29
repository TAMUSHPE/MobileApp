import React from 'react';
import renderer from 'react-test-renderer'
import ProfileBadge from "../ProfileBadge";

describe("<ProfileBadge />", () => {
    it("Has 1 child", () => {
        const tree = renderer.create(<ProfileBadge />).toJSON();
        expect(tree).toBeTruthy();
    });
});