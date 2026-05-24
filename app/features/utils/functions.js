

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
 * Validates the input as a meeting name and creates a Conference object
 * for the default server.
 *
 * @param {string} inputURL - Meeting name value from user input or protocol.
 * @param {string} defaultServerURL - Server URL to use for room-only input.
 * @returns {Object}
 */
export function createConferenceObjectFromURL(inputURL, defaultServerURL) {
    let room = (inputURL || '').trim();
    const serverURL = normalizeServerURL(defaultServerURL || '');

    // Don't navigate if no room was specified.
    if (!room) {
        return;
    }

    // Treat any pasted URL-like value as a meeting name by taking only
    // the last path segment and dropping query/hash fragments.
    if (room.includes('/')) {
        room = room.substring(room.lastIndexOf('/') + 1);
    }

    room = room.split('?')[0].split('#')[0].trim();

    if (!room || /[:/?#]/.test(room)) {
        return;
    }

    return {
        room,
        serverURL
    };
}
