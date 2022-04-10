/** @module */
import { authorize } from '/js/modules/gapi.js';
import { storeIDElements } from '/js/modules/dom.js';
import { positive as checkPositive, futureTimestamp as checkFutureTimestamp } from '/js/modules/validation/core.js';
import initForm, { slugifyInput, showError, hideError, getRadioValue } from '/js/modules/forms.js';

let idToken;
const el = {};

// Class Check
// --------------------------------------------
/**
 * Check the user is authorised to create a new assignment.
 * Check the class exists and the user is the owner.
 */
async function classAuth(className) {
    const response = await fetch(`/api/classes/${className}`, {
        credentials: 'same-origin',
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
    });

    if (response.ok) {
        const cl = await response.json();

        if (cl.isOwner) {
            el.className.textContent = className;
            return true;
        } else {
            window.location = '/404';
        }
    } else if (response.status === 401 || response.status === 404) {
        window.location = '/404';
    } else {
        el.async.error();
    }
    return false;
}


// Validation Checks
// --------------------------------------------
/** Check assignment short name is available */
async function checkShortName(shortName, className) {
    const response = await fetch(`/api/classes/${className}/assignments/${shortName}`, {
        credentials: 'same-origin',
        method: 'HEAD',
        headers: { Authorization: `Bearer ${idToken}` },
    });

    if (response.ok) {
        return 'That short name is already taken';
    } else if (response.status === 404) {
        return '';
    } else {
        return 'Error checking short name';
    }
}

/** Check reviews deadline is later than deadline */
function checkReviewsDeadline(reviewsDeadline) {
    if (el.deadline.value && reviewsDeadline) {
        if (new Date(el.deadline.value) >= new Date(reviewsDeadline)) {
            return 'Reviews deadline must be later than the deadline';
        }
    }
    return '';
}


// Create Assignment
// --------------------------------------------
/** Get request body for creating assignment */
function getAsgmntBody() {
    const body = {
        name: el.asgmntName.value,
        shortName: el.shortName.value,
        anonymous: getRadioValue(el.anonymous) === 'true',
        minReviews: parseInt(el.minReviews.value),
        ratingMax: parseInt(el.ratingMax.value),
    };

    if (el.description.value) body.description = el.description.value;
    if (el.deadline.value) {
        body.deadline = new Date(el.deadline.value).toISOString();
    }
    if (el.reviewsDeadline.value) {
        body.reviewsDeadline = new Date(el.reviewsDeadline.value).toISOString();
    }

    return body;
}

async function createAsgmnt(className) {
    const response = await fetch(`/api/classes/${className}/assignments`, {
        credentials: 'same-origin',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(getAsgmntBody()),
    });

    if (response.ok) {
        hideError(el.form);
        window.location = `/class/${className}/assignment/${el.shortName.value}`;
    } else if (response.status === 400) {
        showError(el.form, 'Invalid data entered');
    } else {
        showError(el.form);
    }
}


// Form Setup
// --------------------------------------------
function setupForm(className) {
    const validation = initForm(el.form, true);
    slugifyInput(el.asgmntName, el.shortName, validation);

    validation.addCheck(el.shortName, async (shortName) => {
        return await checkShortName(shortName, className);
    });
    validation.addCheck(el.minReviews, checkPositive);
    validation.addCheck(el.ratingMax, checkPositive);
    validation.addCheck(el.deadline, checkFutureTimestamp);
    validation.addCheck(el.reviewsDeadline, checkFutureTimestamp);
    validation.addCheck(el.reviewsDeadline, checkReviewsDeadline);

    el.createBtn.addEventListener('click', async () => {
        const valid = await validation.checkAll();
        if (valid) createAsgmnt(className);
    });
}


// Init
// --------------------------------------------
async function onAutorize(response) {
    idToken = response.id_token;
    const className = window.location.pathname.split('/')[2];
    const authed = await classAuth(className);

    if (authed) {
        setupForm(className);
        el.async.finish();
    }
}

function init() {
    el.async = document.querySelector('await-async');
    el.form = document.querySelector('form');
    storeIDElements(el);
    authorize(onAutorize);
}

window.addEventListener('load', init);
