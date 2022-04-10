/** @module */
/* global gapi */

export const config = {
    client_id: '19518467849-a7ltiak6hv9bl3b9hm6uih8h93jm5fr5.apps.googleusercontent.com',
    scope: 'email profile openid',
    response_type: 'id_token',
};

export const authorizeConfig = { prompt: 'none', ...config };

/** Add gapi script to the current page and attach an onload function */
export function addGapi(onload) {
    const currentScript = document.querySelector('script[src="https://apis.google.com/js/platform.js"]');

    if (!currentScript) {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/platform.js';
        script.onload = () => gapi.load('auth2', onload);
        document.body.append(script);
    } else {
        onload();
    }
}

/** Authorize callback wrapper to handle non-authorized users globally */
function authorizeCallback(response, callback) {
    if (!response.error) {
        callback(response);
    } else {
        window.location = '/404?from=' + encodeURI(window.location.pathname);
    }
}

/**
 * Load gapi and authorize
 * @param {function (gapi.auth2.AuthorizeResponse)} callback
 * Function to be called after authorization, with a response param to handle authorization response
 * @param {boolean} [redirect = true] If the page should be redirected to 404 on authorize fail
*/
export function authorize(callback, redirect = true) {
    addGapi(() => {
        gapi.auth2.authorize(authorizeConfig, (response) => {
            if (redirect) {
                authorizeCallback(response, callback);
            } else {
                callback(response);
            }
        });
    });
}

/**
 * Load gapi, authorize and check the user is registered
 * @param {function (gapi.auth2.AuthorizeResponse)} callback
 * Function to be called after authorization, with a response param to handle authorization response
 * @param {boolean} [redirect = true]
 * If the page should be redirected to 404 on authorize fail or unregistered user
*/
export function authorizeRegistered(callback, redirect = true) {
    authorize(async (gapiResponse) => {
        const response = await fetch(`/api/me/registered`, {
            credentials: 'same-origin',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${gapiResponse.id_token}` },
        });

        if (response.status === 200) { // User is registered
            callback(gapiResponse);
        } else if (response.status === 204) { // User is not registered
            if (redirect) {
                window.location = '/404';
            } else {
                gapiResponse.error = 'user not registered';
                callback(gapiResponse);
            }
        } else {
            gapiResponse.error = 'registration check failed';
            callback(gapiResponse);
        }
    }, redirect);
}
