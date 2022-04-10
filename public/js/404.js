import { authorizeRegistered } from '/js/modules/gapi.js';

// Init
// --------------------------------------------
function init() {
    // If provided, redirect user to 'from' url when they authorize succesfully
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('from');

    if (fromUrl) {
        authorizeRegistered((response) => {
            if (!response.error) {
                window.location = window.location.origin + decodeURI(fromUrl);
            }
        }, false);
    }
}

window.addEventListener('load', init);
