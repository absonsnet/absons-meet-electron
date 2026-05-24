

/**
 * Normalizes the given server URL so it has the proper scheme.
 *
 * @param {string} url - URL with or without scheme.
 * @returns {string}
 */
export function normalizeServerURL(url) {
    // eslint-disable-next-line no-param-reassign
    url = url.trim();

    if (url && url.indexOf('://') === -1) {
        return `https://${url}`;
    }

    return url;
}

/**
 * Opens the provided link in default broswer.
 *
 * @param {string} link - Link to open outside the desktop app.
 * @returns {void}
 */
export function openExternalLink(link) {
    window.jitsiNodeAPI.openExternalLink(link);
}

/**
 * Validation errors for conference input parsing.
 *
 * @type {{INVALID: string, NON_DEFAULT_SERVER: string}}
 */
export const CONFERENCE_INPUT_ERRORS = {
    INVALID: 'invalidMeetingInput',
    NON_DEFAULT_SERVER: 'meetingHostedElsewhere'
};

/**
 * Parses and returns the host from the configured default server URL.
 *
 * @param {string} defaultServerURL - Default server URL.
 * @returns {string}
 */
function _getDefaultServerHost(defaultServerURL) {
    const normalizedServerURL = normalizeServerURL(defaultServerURL || '');

    if (!normalizedServerURL) {
        return '';
    }

    try {
        return new URL(normalizedServerURL).host.toLowerCase();
    } catch (_) {
        return '';
    }
}

/**
 * Parses and validates conference input.
 *
 * Rules:
 * - Plain meeting names are accepted.
 * - URL/path inputs are accepted only when they point to the default server.
 *
 * @param {string} inputURL - Meeting name value from user input or protocol.
 * @param {string} defaultServerURL - Default server URL.
 * @returns {{
 *     conference: ?Object,
 *     error: ?string
 * }}
 */
export function parseConferenceInput(inputURL, defaultServerURL) {
    const rawInput = (inputURL || '').trim();
    const serverURL = normalizeServerURL(defaultServerURL || '');
    const defaultHost = _getDefaultServerHost(defaultServerURL);
    let room = rawInput;

    if (!rawInput || !serverURL || !defaultHost) {
        return {
            conference: undefined,
            error: CONFERENCE_INPUT_ERRORS.INVALID
        };
    }

    const isUrlLikeInput = rawInput.includes('://') || rawInput.includes('/');

    if (isUrlLikeInput) {
        try {
            const parsedURL = new URL(normalizeServerURL(rawInput));
            const inputHost = parsedURL.host.toLowerCase();

            if (inputHost !== defaultHost) {
                return {
                    conference: undefined,
                    error: CONFERENCE_INPUT_ERRORS.NON_DEFAULT_SERVER
                };
            }

            room = parsedURL.pathname
                .split('/')
                .filter(Boolean)
                .pop() || '';
        } catch (_) {
            return {
                conference: undefined,
                error: CONFERENCE_INPUT_ERRORS.INVALID
            };
        }
    }

    room = room.split('?')[0].split('#')[0].trim();

    if (!room || /[:/?#]/.test(room)) {
        return {
            conference: undefined,
            error: CONFERENCE_INPUT_ERRORS.INVALID
        };
    }

    return {
        conference: {
            room,
            serverURL
        },
        error: undefined
    };
}

/**
 * Validates the input as a meeting name and creates a Conference object
 * for the default server.
 *
 * @param {string} inputURL - Meeting name value from user input or protocol.
 * @param {string} defaultServerURL - Server URL to use for room-only input.
 * @returns {Object}
 */
export function createConferenceObjectFromURL(inputURL, defaultServerURL) {
    return parseConferenceInput(inputURL, defaultServerURL).conference;
}
