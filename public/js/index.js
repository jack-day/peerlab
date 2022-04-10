/* global gapi */
import { authorizeRegistered, config as gapiConfig } from '/js/modules/gapi.js';

const el = {};

// Sign Up
// --------------------------------------------
function signUpError(btn) {
    const innerBtn = btn.querySelector('button');
    const text = innerBtn.textContent;
    btn.classList.add('error');
    innerBtn.textContent = 'An Error Occurred';

    setTimeout(() => {
        btn.classList.remove('error');
        innerBtn.textContent = text;
    }, 3000);
}

async function signUp(googleUser, btn) {
    const idToken = googleUser.getAuthResponse().id_token;
    const response = await fetch('/api/users', {
        credentials: 'same-origin',
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
    });

    if (response.ok) {
        window.location = '/classes';
    } else if (response.status === 400) {
        const body = await response.json();

        if (body.errors.length === 1 && body.errors[0].message === 'user exists') {
            window.location = '/classes';
        } else {
            signUpError(btn);
        }
    } else {
        signUpError(btn);
    }
}


// Init
// --------------------------------------------
function attachAuthClickHandler(btn, googleAuth) {
    googleAuth.attachClickHandler(btn, {},
        (googleUser) => signUp(googleUser, btn),
        (response) => {
            // Check only for iframe init fail as other errors are due to the user
            if (response.error === 'idpiframe_initialization_failed') {
                console.error(response);
                signUpError(btn);
            }
        }
    );
}

function init() {
    el.signInBtns = document.querySelectorAll('.sign-in-btn');
    el.scrollBtn = document.querySelector('#scroll-btn');
    el.main = document.querySelector('main');

    el.scrollBtn.addEventListener('click', () =>
        el.main.scrollIntoView({ behavior: 'smooth' })
    );

    authorizeRegistered((response) => {
        if (response.error) {
            const googleAuth = gapi.auth2.init(gapiConfig);
            el.signInBtns.forEach(btn => attachAuthClickHandler(btn, googleAuth));
        } else {
            window.location = '/classes';
        }
    }, false);
}

window.addEventListener('load', init);

