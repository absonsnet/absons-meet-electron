
import React, { Component } from 'react';

import logoPng from '../../../images/logo.png';

/**
 * Logo component.
 */
export default class Logo extends Component {

    /**
     * Render function of component.
     *
     * @returns {ReactElement}
     */
    render() {
        return (
            <img
                alt = 'ABSONS Meet'
                height = { 40 }
                src = { logoPng }
                width = { 40 } />
        );
    }
}
