/* global gapi */
import { authorizeRegistered, getIsDemo, config as gapiConfig } from '/js/modules/gapi.js';

const el = {};

// Sign Up
// --------------------------------------------
function signUpError(btn) {
    const innerBtn = btn.querySelector('button') ?? btn;
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


// Demo Mode
// --------------------------------------------
async function demoSignUp() {
    const response = await fetch('/api/users', {
        credentials: 'same-origin',
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${el.demoSignUpForm.email.value}`,
            'peerlab-demo-given-name': el.demoSignUpForm.firstName.value,
            'peerlab-demo-family-name': el.demoSignUpForm.lastName.value,
        },
    });

    const cookie = `PEERLAB_DEMO_EMAIL=${el.demoSignUpForm.email.value}; max-age=${60*60*24*14}`;

    if (response.ok) {
        document.cookie = cookie;
        window.location = '/classes';
    } else if (response.status === 400) {
        const body = await response.json();

        if (body.errors.length === 1 && body.errors[0].message === 'user exists') {
            document.cookie = cookie;
            window.location = '/classes';
        } else {
            signUpError(el.demoSignUpForm.submit);
        }
    } else {
        signUpError(el.demoSignUpForm.submit);
    }
}

function setupDemoMode() {
    // Switch bottom cta login button to a scroll back to top button
    el.lastCtaBtn.parentElement.classList.add('demo');
    el.lastCtaBtn.textContent = 'Back to Top';
    el.lastCtaBtn.addEventListener('click', () =>
        document.body.scrollIntoView({ behavior: 'smooth' }));

    el.signUpBtn.remove();
    const p = document.createElement('p');
    p.textContent = 'You are in demo mode.';
    el.heroSubtitle.append(p);
    el.demoSignUp.classList.add('show');

    el.demoSignUpForm.submit.addEventListener('click', (e) => {
        e.preventDefault();
        demoSignUp();
    });
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

async function init() {
    el.signUpBtn = document.querySelector('#sign-up-btn');
    el.lastCtaBtn = document.querySelector('#last-cta-btn');
    el.demoSignUp = document.querySelector('#demo-sign-up');
    el.heroSubtitle = document.querySelector('#hero-subtitle');
    el.scrollBtn = document.querySelector('#scroll-btn');
    el.main = document.querySelector('main');
    el.demoSignUpForm = {
        firstName: document.querySelector('#demo-first-name'),
        lastName: document.querySelector('#demo-last-name'),
        email: document.querySelector('#demo-email'),
        submit: el.demoSignUp.querySelector('button'),
    };

    el.scrollBtn.addEventListener('click', () =>
        el.main.scrollIntoView({ behavior: 'smooth' }));

    let isDemo;
    try {
        isDemo = await getIsDemo();
    } catch (err) {
        signUpError(el.signUpBtn);
        throw err;
    }
        
    authorizeRegistered((response) => {
        if (response.error) {
            if (!isDemo) {
                const googleAuth = gapi.auth2.init(gapiConfig);
                attachAuthClickHandler(el.signUpBtn, googleAuth);
                attachAuthClickHandler(el.lastCtaBtn, googleAuth);
            } else {
                setupDemoMode();
            }
        } else {
            window.location = '/classes';
        }
    }, false);
}

window.addEventListener('load', init);

