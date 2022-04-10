/** @module */

let auth2;
const el = {};

// Helpers
// --------------------------------------------
/**
 * Function to trigger React's input event
 * - Needed to automate 'Authorize with Google' button
 * - Swagger uses React and therefore the Authorize button
 *   will not work unless the input event is triggered,
 *   regardless of if the input's value has been changed
 * - Source: [https://github.com/facebook/react/issues/11488#issuecomment-347775628](https://github.com/facebook/react/issues/11488#issuecomment-347775628)
 * @param {Node} input Input to insert value into and trigger event on
 * @param {string} value Value to be inserted
 */
function triggerReactInput(input, value) {
    const lastValue = input.value;
    input.value = value;

    const event = new Event('input', { bubbles: true });
    event.simulated = true;

    const tracker = input._valueTracker;
    if (tracker) tracker.setValue(lastValue);

    input.dispatchEvent(event);
}

/** Wait for an element to be added to the DOM, then run a callback function  */
function waitForElement(selector, callback, parent = document) {
    const interval = setInterval(() => {
        if (parent.querySelector(selector)) {
            callback();
            clearInterval(interval);
        }
    }, 100);
}


// Add Google Authorization Option
// --------------------------------------------
function addGapi(onload) {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/platform.js';
    script.onload = onload;
    document.querySelector('body').append(script);
}

/**
 * Automate Swagger's authorization with Google on click
 * @param {Node} button New 'Authorize with Google' button to attach handler to
 * @param {Node} input Swagger's authorization input
 * @param {Node} authorizeBtn Swagger's authorization button
 */
function onClickAuth(button, input, authorizeBtn) {
    auth2.attachClickHandler(button, {},
        (googleUser) => {
            triggerReactInput(input, googleUser.getAuthResponse().id_token);
            authorizeBtn.click();
        },
        (error) => {
            alert(JSON.stringify(error, undefined, 2));
        }
    );
}

/** Add 'Authorize with Google' button to Swagger's authorizations */
function addSignIn() {
    const container = el.authWrapper.querySelector('.modal-ux .auth-container');
    const input = container.querySelector('form input');
    const authorizeBtn = container.querySelector('.authorize');

    const button = document.createElement('button');
    button.classList.add('btn', 'authorize');
    button.textContent = 'Authorize with Google';
    button.style = 'margin-left: 1em';

    onClickAuth(button, input, authorizeBtn);

    input.after(button);
    authorizeBtn.onclick = () => {
        // Re-add Sign-In button if user logs out
        if (authorizeBtn.textContent === 'Logout') {
            waitForElement('form input', addSignIn, container);
        }
    };
}

function clickEventHandler() {
    waitForElement('.modal-ux .auth-container', addSignIn, el.authWrapper);
}


// Init
// --------------------------------------------
function init() {
    el.authWrapper = document.querySelector('.auth-wrapper');
    const authorizeBtn = document.querySelector('.auth-wrapper > .authorize');
    const authorizeIconBtns = document.querySelectorAll('.authorization__btn');

    addGapi(() => {
        gapi.load('auth2', () => { // eslint-disable-line no-undef
            auth2 = gapi.auth2.init({ // eslint-disable-line no-undef
                client_id: '19518467849-a7ltiak6hv9bl3b9hm6uih8h93jm5fr5.apps.googleusercontent.com',
                scope: 'email profile openid',
                response_type: 'id_token',
            });
        });
    });

    authorizeBtn.addEventListener('click', clickEventHandler);
    for (const btn of authorizeIconBtns) {
        btn.addEventListener('click', clickEventHandler);
    }
}

window.addEventListener('load', () => {
    waitForElement('#swagger-ui', init);
});
