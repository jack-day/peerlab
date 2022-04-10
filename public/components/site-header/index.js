/** @module */
/* global gapi */
import BetterElement from '../better-element.js';
import { authorize, config } from '/js/modules/gapi.js';
import { showMsg } from '/js/modules/dom.js';

// Templates
// --------------------------------------------
const template = document.createElement('template');
template.innerHTML = `
    <header>
        <link href="/components/site-header/style.css" rel="stylesheet" type="text/css">
        <a id="logo" href="/">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
                <g>
                    <path d="M12.1 143.4L11 223.24L249.18 84.82L250.28 5L12.1 143.4Z" />
                    <path d="M12.1 278.29L11 358.12L249.18 219.72L250.28 139.88L12.1 278.29Z" />
                    <path d="M251.82 416.71L250.76 496.53L488.91 358.12L490 278.29L251.82 416.71Z" />
                    <path d="M251.82 281.81L250.76 361.66L488.91 223.24L490 143.4L251.82 281.81Z" />
                    <g fill-opacity="0.7">
                        <path d="M11 223.24L250.76 361.66L251.82 281.81L12.1 143.4L11 223.24Z" />
                        <path d="M249.18 84.82L488.91 223.24L490 143.4L250.28 5L249.18 84.82Z" />
                        <path d="M249.18 219.72L488.91 358.12L490 278.29L250.28 139.88L249.18 219.72Z" />
                        <path d="M11 358.12L250.76 496.53L251.82 416.71L12.1 278.29L11 358.12Z" />
                    </g>
                </g>
            </svg>
            <h1>PeerLab</h1>
        </a>
        <nav class="signin">
            <button id="signin-btn" class="loading">Sign In</button>
        </nav>
    </header>
`;

const navTemplate = document.createElement('template');
navTemplate.innerHTML = `
    <a href="/classes">Classes</a>
    <a href="/profile">
        <img id="profile-img" aria-label="profile">
    </a>
`;


// Site Header
// --------------------------------------------
export class SiteHeader extends BetterElement {
    constructor() {
        super();
        const clone = template.content.cloneNode(true);
        this.el.nav = clone.querySelector('nav');
        this.storeIDElements(clone);

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.append(clone);

        authorize(this.#onAuthorize(), false);
    }

    /** Check if the user is registered
     * @returns API response status code */
    async #userRegistered(idToken) {
        const response = await fetch(`/api/me/registered`, {
            credentials: 'same-origin',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${idToken}` },
        });
        return response.status;
    }

    #onAuthorize() {
        return async (response) => {
            if (response.error) {
                this.#attachSignIn();
            } else {
                const status = await this.#userRegistered(response.id_token);
                
                if (status === 200) { // User is registered
                    this.#showNav(response.id_token);
                    this.el.logo.href = '/classes';
                } else if (status === 204) { // User is not registered
                    const googleAuth = this.#attachSignIn();
                    googleAuth.signOut(true);
                    this.#signInError('Account Not Found');
                } else {
                    this.el.signinBtn.remove();
                    showMsg(this.el.nav, 'An Error Ocurred', 'notice', 'error');
                }
            }
        };
    }


    // Sign In Button
    // --------------------------------------------
    #attachSignIn() {
        const googleAuth = gapi.auth2.init(config);
        googleAuth.attachClickHandler(this.el.signinBtn, {},
            (googleUser) => this.#onSignInSuccess(googleAuth, googleUser),
            (response) => {
                // Check only for iframe init fail as other errors are due to the user
                if (response.error === 'idpiframe_initialization_failed') {
                    console.error(response);
                    this.#signInError();
                }
            }
        );

        this.el.signinBtn.classList.remove('loading');
        return googleAuth;
    }

    /**
     * Event handler for successful gapi signin,
     * checks the user is registered and refreshes the page if true.
     */
    async #onSignInSuccess(auth, user) {
        const idToken = user.getAuthResponse().id_token;
        const status = await this.#userRegistered(idToken);

        if (status === 200) {
            window.location.reload();
        } else {
            auth.signOut(true);
            this.#signInError(status === 204 ? 'Account Not Found' : undefined);
        }
    }

    #signInError(msg = 'An Error Occurred') {
        this.el.signinBtn.classList.add('error');
        this.el.signinBtn.textContent = msg;

        setTimeout(() => {
            this.el.signinBtn.classList.remove('error');
            this.el.signinBtn.textContent = 'Sign In';
        }, 3000);
    }
    

    // Authenticated User Navigation
    // --------------------------------------------
    async #getUserAvatar(idToken) {
        const response = await fetch(`/api/me/avatar`, {
            credentials: 'same-origin',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${idToken}` },
        });
    
        if (response.ok) {
            const avatarUrl = await response.json();
            return avatarUrl;
        }
    }

    async #showNav(idToken) {
        const clone = navTemplate.content.cloneNode(true);
        this.storeIDElements(clone);

        // Remove login elements
        for (const elem of [...this.el.nav.children]) {
            elem.remove();
        }
        
        const avatarUrl = await this.#getUserAvatar(idToken);
        if (avatarUrl) this.el.profileImg.src = avatarUrl;

        this.el.nav.classList.remove('signin');
        this.el.nav.append(clone);
    }
}

customElements.define('site-header', SiteHeader);
