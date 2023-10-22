import React from 'react';
import renderer from 'react-test-renderer'
import InteractButton from '../InteractButton';

describe("<InteractButton />", () => {
    it("Renders", () => {
        const tree = renderer.create(<InteractButton onPress={() => { }} />).toJSON();
        expect(tree).toBeTruthy();
    });

    
});