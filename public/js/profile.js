/** @module */
/* global gapi */
import { authorize, config as gapiConfig } from '/js/modules/gapi.js';
import { storeIDElements } from '/js/modules/dom.js';
import initForm, { showError, hideError } from '/js/modules/forms.js';
import LinearProgress from '/components/progress-indicator/linear/index.js';
import LikeBar from '/components/like-bar/index.js';

let idToken;
const el = {};

// Get Profile
// --------------------------------------------
async function getProfile() {
    const response = await fetch('/api/me', {
        credentials: 'same-origin',
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
    });

    if (response.ok) {
        return await response.json();
    } else if (response.status === 401) {
        window.location = '/404';
    } else {
        el.async.error();
    }
}


// Profile Details
// --------------------------------------------
/** Sign the user out and remove gapi authorisation to stop auto login */
async function signOut() {
    const googleAuth = gapi.auth2.getAuthInstance();
    await googleAuth.signOut(true);
    window.location = '/';
}

function addDetailsUI(profile) {
    el.avatar.src = profile.avatarUrl;
    el.name.textContent = `${profile.firstName} ${profile.lastName}`;
    el.signOut.addEventListener('click', signOut);
}


// Stats
// --------------------------------------------
function addStatsUI(profile) {
    const asgmntsComplete = new LinearProgress(
        profile.assignmentsCompleted,
        profile.assignmentCount,
        { text: 'Assignments Complete' }
    );
    
    const overallRating = new LinearProgress(
        profile.averageFeedbackRating * 100,
        100,
        {
            text: 'Average Overall Rating - ',
            percentage: true,
            prepend: true,
        }
    );

    const reviewsComplete = new LinearProgress(
        profile.reviewsCompleted,
        profile.totalMinReviews,
        { text: 'Peer Reviews Completed' }
    );

    const likeRatio = new LikeBar(
        profile.totalReviewLikes,
        profile.totalReviewDislikes,
        { text: 'Total Review Likes' }
    );

    el.workStats.append(asgmntsComplete, overallRating);
    el.reviewStats.append(reviewsComplete, likeRatio);
}


// Account
// --------------------------------------------
/** Update avatar API call */
async function updateAvatar() {
    const formData = new FormData();
    formData.append('avatar', el.avatarInput.files[0]);

    const response = await fetch(`/api/me/avatar`, {
        credentials: 'same-origin',
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: formData,
    });

    if (response.ok) {
        hideError(el.updateAvatar);
        window.location.reload();
    } else if (response.status === 400) {
        showError(el.updateAvatar, 'Invalid file upload');
    } else {
        showError(el.updateAvatar);
    }
}

/** Update account API call */
async function updateAccount() {
    const response = await fetch(`/api/me`, {
        credentials: 'same-origin',
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            firstName: el.firstNameInput.value,
            lastName: el.lastNameInput.value,
        }),
    });

    if (response.ok) {
        hideError(el.updateAccount);
        window.location.reload();
    } else if (response.status === 400) {
        showError(el.updateAccount, 'Invalid data entered');
    } else {
        showError(el.updateAccount);
    }
}

/** Delete account API call for dialog delete button */
async function deleteAccount() {
    const response = await fetch(`/api/me`, {
        credentials: 'same-origin',
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` },
    });

    if (response.ok) {
        hideError(el.deleteDialog.section);
        signOut();
    } else {
        showError(el.deleteDialog.section);
    }
}

function setupAvatarForm() {
    const validation = initForm(el.updateAvatar, true);
    el.saveAvatarBtn.addEventListener('click', async () => {
        const valid = await validation.checkAll();
        if (valid) updateAvatar();
    });
}

function setupAccountForm(profile) {
    const validation = initForm(el.updateAccount, true);

    el.firstNameInput.value = profile.firstName;
    el.lastNameInput.value = profile.lastName;

    el.saveAccountBtn.addEventListener('click', async () => {
        const valid = await validation.checkAll();
        if (valid) updateAccount();
    });
}

function addAccountTab(profile) {
    setupAvatarForm();
    setupAccountForm(profile);
    el.deleteBtn.addEventListener('click', () => el.deleteDialog.showModal());
    el.deleteDialogBtn.addEventListener('click', () => deleteAccount());
}


// Init
// --------------------------------------------
async function onAuthorize(response) {
    idToken = response.id_token;
    try {
        await gapi.auth2.init(gapiConfig);
        const profile = await getProfile();

        if (profile) {
            addDetailsUI(profile);
            addStatsUI(profile);
            addAccountTab(profile);
            el.async.finish();
        }
    } catch (err) {
        console.log(err);
        el.async.error();
    }
}

function init() {
    el.async = document.querySelector('await-async');
    el.main = document.querySelector('main');
    storeIDElements(el);
    authorize(onAuthorize);
}

window.addEventListener('load', init);
