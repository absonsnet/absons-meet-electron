import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Conference } from '../../conference';
import config from '../../config';
import Spinner from '../../shared/components/Spinner';
import { createConferenceObjectFromURL } from '../../utils';

/**
 * Main component encapsulating the Meeting Window application.
 */
class MeetingApp extends Component {
    /**
     * Initializes a new {@code MeetingApp} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        document.title = config.appName;

        this.state = {
            conference: null
        };
    }

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @returns {void}
     */
    componentDidMount() {
        // Meeting window: set conference data when main process sends it.
        this._removeConferenceListener = window.jitsiNodeAPI.ipc.addListener(
            'navigate-to-conference',
            conference => {
                if (conference && typeof conference === 'object' && conference.room) {
                    try {
                        const url = new URL(conference.room, config.defaultServerURL);

                        document.title = url.href;
                    } catch (e) {
                        document.title = `${config.defaultServerURL}/${conference.room}`;
                    }
                    this.setState({ conference });
                } else {
                    console.warn('Invalid conference object received over IPC');
                }
            }
        );

        this._removeProtocolDataListener = window.jitsiNodeAPI.ipc.addListener(
            'protocol-data-msg',
            inputURL => {
                let parsedURL = inputURL;

                // Remove trailing slash if one exists.
                if (parsedURL.slice(-1) === '/') {
                    parsedURL = parsedURL.slice(0, -1);
                }

                const conference = createConferenceObjectFromURL(
                    parsedURL,
                    config.defaultServerURL
                );

                if (conference && conference.room) {
                    this.setState({ conference });
                }
            }
        );

        // send notification to main process
        window.jitsiNodeAPI.ipc.send('renderer-ready');
    }

    /**
     * Implements React's {@link Component#componentWillUnmount()}.
     *
     * @returns {void}
     */
    componentWillUnmount() {
        if (this._removeConferenceListener) {
            this._removeConferenceListener();
        }

        if (this._removeProtocolDataListener) {
            this._removeProtocolDataListener();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { conference } = this.state;

        // Wait for the IPC message to deliver the conference details.
        if (!conference) {
            return (
                <div
                    style = {{
                        display: 'flex',
                        height: '100vh',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                    <Spinner size = 'large' />
                </div>
            );
        }

        return (
            <Conference conference = { conference } />
        );
    }
}

export default connect()(MeetingApp);
