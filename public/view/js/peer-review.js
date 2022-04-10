/** @module */
import { authorize } from '/js/modules/gapi.js';
import { storeIDElements } from '/js/modules/dom.js';
import animate from '/js/modules/animate.js';
import initForm, { showError, hideError } from '/js/modules/forms.js';
import ProgressBar from '/components/progress-indicator/linear/index.js';

let idToken;
const el = {};

// Helpers
// --------------------------------------------
/** Get boolean for if all peer work has been reviewed */
function allPeersReviewed(asgmnt) {
    const peerSubmissions = asgmnt.totalSubmissions - (asgmnt.workUUID ? 1 : 0);
    return peerSubmissions <= asgmnt.peersReviewed;
}


// API Fetch Calls
// --------------------------------------------
async function getAssignment(asgmntName, className) {
    const response = await fetch(`/api/classes/${className}/assignments/${asgmntName}`, {
        credentials: 'same-origin',
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
    });

    if (response.ok) {
        const asgmnt = await response.json();
        return asgmnt;
    } else if (response.status === 401 || response.status === 404) {
        window.location = '/404';
    } else {
        el.async.error();
    }
}

async function getPeerWork(asgmntName, className) {
    const response = await fetch(`/api/classes/${className}/assignments/${asgmntName}/peer-work`, {
        credentials: 'same-origin',
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
    });

    if (response.ok) {
        const peerWork = await response.json();
        return peerWork;
    }
}

async function getUser(uuid) {
    const response = await fetch(`/api/users/${uuid}/`, {
        credentials: 'same-origin',
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
    });

    if (response.ok) {
        const user = await response.json();
        return user;
    }
}


// Header
// --------------------------------------------
function addHeaderUI(asgmnt, className) {
    const classLink = document.createElement('a');
    classLink.href = `/class/${className}`;
    classLink.textContent = className;

    const asgmntLink = document.createElement('a');
    asgmntLink.href = `/class/${className}/assignment/${asgmnt.shortName}`;
    asgmntLink.textContent = asgmnt.shortName;

    el.reviewsProgress = new ProgressBar(
        asgmnt.peersReviewed,
        asgmnt.minReviews,
        {
            tagName: 'h3',
            text: 'Complete',
        }
    );

    el.title.append(el.reviewsProgress);
    el.shortName.append(classLink,  ' / ', asgmntLink);
}


// Review Form
// --------------------------------------------
function ratingMaxCheck(ratingMax) {
    return (val) => {
        if (val > ratingMax) {
            return `Rating cannot be larger than ${ratingMax}`;
        }
        return '';
    };
}

class ReviewForm extends HTMLElement {
    constructor(asgmnt, peerWork, peer) {
        super();
        const clone = el.reviewTemplate.content.cloneNode(true);
        
        // Setup el
        this.el = {};
        this.el.form = clone.querySelector('form');
        storeIDElements(this.el, clone);

        // Init
        this.addWorkUI(peerWork, peer);
        this.el.ratingMax.textContent = `/ ${asgmnt.ratingMax}`;
        this.el.rating.ariaLabel = `Rating out of ${asgmnt.ratingMax}`;
        this.validation = initForm(this.el.form, true);
        this.validation.addCheck(this.el.rating, ratingMaxCheck(asgmnt.ratingMax));
        this.el.complete.addEventListener('click',
            this.onSubmitClick(asgmnt, peerWork.uuid));

        this.append(clone);
    }


    // Work UI
    // --------------------------------------------
    addWorkUI(peerWork, peer) {
        if (peerWork.type === 'pdf') {
            const splitUrl = peerWork.url.split('/');
            this.el.workLink.href = peerWork.url;
            this.el.workLink.textContent = splitUrl[splitUrl.length - 1];
        } else {
            this.el.workLink.textContent = this.el.workLink.href = peerWork.url;
        }

        if (peer) {
            this.el.peerAvatar.src = peer.avatarUrl;
            this.el.peerName.textContent = `${peer.firstName} ${peer.lastName}`;
        } else {
            this.el.peerAvatar.classList.add('hide');
            this.el.peerName.classList.add('hide');
            this.el.work.classList.add('anonymous');
        }
    }

    
    // Submit Review
    // --------------------------------------------
    onSubmitClick(asgmnt, workUUID) {
        return async () => {
            const valid = await this.validation.checkAll();
            if (valid) this.submit(asgmnt, workUUID);
        };
    }

    async submit(asgmnt, workUUID) {
        const response = await fetch(`/api/work/${workUUID}/reviews`, {
            credentials: 'same-origin',
            method: 'post',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                rating: this.el.rating.valueAsNumber,
                feedback: this.el.feedback.value,
            }),
        });
    
        if (response.ok) {
            hideError(this.el.form);
            animate(this, 'fade-out', () => {
                this.remove();
                el.reviewsProgress.updateValue(el.reviewsProgress.value + 1);
                asgmnt.peersReviewed += 1;
                reviewComplete(asgmnt);
            });
        } else {
            showError(this.el.form);
        }
    }
}

customElements.define('review-form', ReviewForm);

/**
 * Fetch a new peer work submission and create a new review form element with it
 * @param {object} asgmnt Assignment API response object
 * @param {string} className Class short name
 * @returns ReviewForm element object or undefined on error
 */
async function newReview(asgmnt, className) {
    const peerWork = await getPeerWork(asgmnt.shortName, className, idToken);

    if (peerWork) {
        if (peerWork.userUUID) {
            const peer = await getUser(peerWork.userUUID, idToken);
            if (peer) return new ReviewForm(asgmnt, peerWork, peer);
        } else {
            return new ReviewForm(asgmnt, peerWork);
        }
    }
}


// Review Complete
// --------------------------------------------
function reviewCompleteText(asgmnt) {
    if (allPeersReviewed(asgmnt)) {
        return "You've reviewed all the work of your peers!";
    } else {
        if (asgmnt.minReviews <= asgmnt.peersReviewed) {
            return "You've reached the minimum reviews target! But you don't have to stop there, more work from your peers is available for you to keep reviewing.";
        } else {
            const reviewsLeft = asgmnt.minReviews - asgmnt.peersReviewed;
            const plural = reviewsLeft === 1 ? 'review' : 'reviews';
            return `You've still got ${reviewsLeft} ${plural} left to reach the minumum reviews target.`;
        }
    }
}

function reviewAnotherBtn(section, asgmnt, className) {
    const reviewBtn = document.createElement('button');
    reviewBtn.textContent = 'Review Another Peer';

    reviewBtn.addEventListener('click', async () => {
        const reviewForm = await newReview(asgmnt, className);

        if (reviewForm) {
            animate(section, 'fade-out', () => {
                section.remove();
                el.main.append(reviewForm);
                animate(reviewForm, 'fade-in');
            });
        } else {
            showError(section);
        }
    });

    return reviewBtn;
}

function reviewComplete(asgmnt) {
    const className = window.location.pathname.split('/')[2];
    const section = document.createElement('section');
    const h2 = document.createElement('h2');
    const p = document.createElement('p');
    const btnContainer = document.createElement('div');
    const backBtnLink = document.createElement('a');
    const backBtn = document.createElement('button');
    
    section.classList.add('review-complete');
    h2.textContent = `Review${allPeersReviewed(asgmnt) ? 's' : ''} Complete`;
    p.textContent = reviewCompleteText(asgmnt);
    btnContainer.classList.add('btn-container');
    backBtn.textContent = 'Back to Assignment';
    backBtnLink.href = `/class/${className}/assignment/${asgmnt.shortName}`;
    backBtnLink.append(backBtn);
    btnContainer.append(backBtnLink);
    
    if (!allPeersReviewed(asgmnt)) {
        const reviewBtn = reviewAnotherBtn(section, asgmnt, className);
        backBtn.classList.add('ghost');
        btnContainer.append(reviewBtn);
    }
    
    section.append(h2, p, btnContainer);
    el.main.append(section);
    animate(section, 'fade-in');
}


// Init
// --------------------------------------------
async function onAuthorize(response) {
    idToken = response.id_token;
    const className = window.location.pathname.split('/')[2];
    const asgmntName = window.location.pathname.split('/')[4];
    const asgmnt = await getAssignment(asgmntName, className, idToken);

    addHeaderUI(asgmnt, className);
    
    if (!allPeersReviewed(asgmnt)) {
        const reviewForm = await newReview(asgmnt, className);
        
        if (reviewForm) {
            el.main.append(reviewForm);
        } else {
            el.async.error();
        }
    } else {
        reviewComplete(asgmnt);
    }

    el.async.finish();
}

function init() {
    el.async = document.querySelector('await-async');
    el.main = document.querySelector('main');
    el.reviewTemplate = document.querySelector('#review-template');
    storeIDElements(el);
    authorize(onAuthorize);
}

window.addEventListener('load', init);
