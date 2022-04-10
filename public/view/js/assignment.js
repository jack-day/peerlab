/** @module */
import { authorize } from '/js/modules/gapi.js';
import { storeIDElements, addReadMoreBtn } from '/js/modules/dom.js';
import { url as validUrl } from '/js/modules/validation/core.js';
import { positive as checkPositive } from '/js/modules/validation/core.js';
import initForm, { showError, hideError, getRadioValue, setRadioValue } from '/js/modules/forms.js';
import AsyncElement from '/components/async.js';
import ProgressBar from '/components/progress-indicator/linear/index.js';
import LikeBar from '/components/like-bar/index.js';
import Review from '/components/review/index.js';

let idToken;
const el = {};

// Helpers
// --------------------------------------------
function addDeadline(elem, deadline, nullText) {
    if (deadline) {
        elem.textContent = new Date(deadline).toLocaleString();
    } else {
        elem.textContent = nullText;
    }
}

/** Remove extension from filename */
function removeExtension(filename) {
    const split = filename.split('.');
    split.pop();
    return split.join('.');
}


// Get Assignment
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


// Details
// --------------------------------------------
function addDetailsUI(asgmnt, className) {
    const classLink = document.createElement('a');
    classLink.href = `/class/${className}`;
    classLink.textContent = className;

    el.name.textContent = asgmnt.name;
    el.shortName.append(classLink,  ` / ${asgmnt.shortName}`);
    addDeadline(el.deadline, asgmnt.deadline, 'No Deadline');
    addDeadline(el.reviewsDeadline, asgmnt.reviewsDeadline, 'No Reviews Deadline');

    if (asgmnt.description) {
        addReadMoreBtn(el.description, asgmnt.description, 550);
    } else {
        el.description.remove();
    }
}


// Work Form
// --------------------------------------------
/** Show/hide url and pdf inputs */
function swapInputs(type) {
    if (type === 'pdf') {
        el.urlLabel.classList.add('hide');
        el.url.dataset.skip = '';
        el.pdfLabel.classList.remove('hide');
        delete el.pdf.dataset.skip;
    } else {
        el.pdfLabel.classList.add('hide');
        el.pdf.dataset.skip = '';
        el.urlLabel.classList.remove('hide');
        delete el.url.dataset.skip;
    }
}

/** Add event listener to type input to show/hide url and pdf inputs */
function bindTypeInput() {
    const inputs = el.type.querySelectorAll('input');

    for (const input of inputs) {
        input.addEventListener('change', (event) => {
            swapInputs(event.target.value);
        });
    }
}

async function putPDF(uuid) {
    const formData = new FormData();
    formData.append('file', el.pdf.files[0]);

    return await fetch(`/api/work/${uuid}/file`, {
        credentials: 'same-origin',
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: formData,
    });
}

function initWorkForm() {
    const validation = initForm(el.workForm, true);
    bindTypeInput();
    validation.addCheck(el.url, validUrl);
    return validation;
}


// Work Submit
// --------------------------------------------
/** Get request body for work submission */
function getWorkBody(asgmntName, className) {
    const body = {
        className,
        asgmntName,
        type: getRadioValue(el.type),
    };

    if (body.type === 'pdf') {
        body.filename = removeExtension(el.pdf.files[0].name);
    } else {
        body.url = el.url.value;
    }

    return body;
}

/** Binds pdf upload to a button */
function bindPdfUpload(btn, uuid) {
    btn.textContent = 'Upload PDF';
    btn.onclick = async () => {
        const pdfResponse = await putPDF(uuid);

        if (pdfResponse.ok) {
            hideError(el.workForm);
            window.location.reload();
        } else {
            showError(el.workForm);
        }
    };
}

async function submitPdf(uuid) {
    const response = await putPDF(uuid);

    if (response.ok) {
        hideError(el.workForm);
        window.location.reload();
    } else {
        showError(el.workForm, 'PDF could not be uploaded, please retry');
        bindPdfUpload(el.submitBtn, uuid);
    }
}

async function submitWork(asgmntName, className) {
    const body = getWorkBody(asgmntName, className);
    const response = await fetch(`/api/work`, {
        credentials: 'same-origin',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (response.ok) {
        if (body.type === 'pdf') {
            const uuid = await response.json();
            submitPdf(uuid);
        } else {
            hideError(el.workForm);
            window.location.reload();
        }
    } else {
        showError(el.workForm);
    }
}

function initSubmitForm(asgmntName, className) {
    const validation = initWorkForm();
    
    el.submitBtn.onclick = async () => {
        const valid = await validation.checkAll();
        if (valid) submitWork(asgmntName, className);
    };
}


// Edit Work Form
// --------------------------------------------
async function updatePdf(uuid) {
    const response = await putPDF(uuid);

    if (response.ok) {
        hideError(el.workForm);
        window.location.reload();
    } else {
        showError(el.workForm);
    }
}

async function updateWork(uuid) {
    const body = getWorkBody();
    const response = await fetch(`/api/work/${uuid}`, {
        credentials: 'same-origin',
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (response.ok) {
        if (body.type === 'pdf') {
            updatePdf(uuid);
        } else {
            hideError(el.workForm);
            window.location.reload();
        }
    } else {
        showError(el.workForm);
    }
}

function initEditForm(work) {
    const validation = initWorkForm();
    const editBtn = document.createElement('button');

    editBtn.textContent = 'Edit';
    el.workForm.querySelector('h2').textContent = 'Edit Your Work';
    el.submitBtn.textContent = 'Save Changes';
    el.submission.append(editBtn);

    if (work.type === 'pdf') {
        setRadioValue(el.type, 'pdf');
        swapInputs('pdf');
    } else {
        el.url.value = work.url;
    }

    editBtn.addEventListener('click', () => {
        el.submission.classList.add('hide');
        el.workForm.classList.remove('hide');
    });

    el.submitBtn.onclick = async () => {
        const valid = await validation.checkAll();
        if (valid) updateWork(work.uuid);
    };
}


// Work Submission
// --------------------------------------------
async function getWork(uuid) {
    const response = await fetch(`/api/work/${uuid}`, {
        credentials: 'same-origin',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${idToken}` },
    });

    if (response.ok) {
        const work = await response.json();
        return work;
    }
}

async function addSubmissionUI(asgmnt) {
    const work = await getWork(asgmnt.workUUID);

    if (work) {
        el.workForm.classList.add('hide');
        el.submission.classList.remove('hide');
        el.uploadTime.textContent = new Date(work.uploadTime).toLocaleString();

        if (work.type === 'pdf') {
            const splitUrl = work.url.split('/');
            el.submissionLink.href = work.url;
            el.submissionLink.textContent = splitUrl[splitUrl.length - 1];
        } else {
            el.submissionLink.textContent = el.submissionLink.href = work.url;
        }

        if (!(asgmnt.deadline && new Date(asgmnt.deadline) < new Date())) {
            initEditForm(work);
        }
    } else {
        el.async.error();
    }
}


// Feedback
// --------------------------------------------
async function getFeedback(uuid) {
    const response = await fetch(`/api/work/${uuid}/reviews`, {
        credentials: 'same-origin',
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
    });

    if (response.ok) {
        const feedback = await response.json();
        return feedback;
    }
}

function getRatingAvg(feedback) {
    return feedback.reduce((acc, val) => acc + val.rating, 0) / feedback.length;
}

function feedbackAveragesEl(feedback, asgmnt) {
    const section = document.createElement('section');
    const h2 = document.createElement('h2');
    
    section.id = 'averages';
    h2.textContent = 'Averages';

    const ratingAvgBar = new ProgressBar(
        getRatingAvg(feedback), 
        asgmnt.ratingMax,
        {
            text: 'Overall Rating - ',
            tagName: 'h3',
            prepend: true,
        }
    );

    section.append(h2, ratingAvgBar);
    return section; 
}

function displayFeedback(feedback, asgmnt) {
    const averages = feedbackAveragesEl(feedback, asgmnt);
    el.feedbackAsync.append(averages);

    const peerReviews = document.createElement('section');
    const h2 = document.createElement('h2');
    peerReviews.id = 'peer-reviews';
    h2.textContent = 'Peer Reviews';
    peerReviews.append(h2);

    for (const review of feedback) {
        const reviewEl = new Review(review, asgmnt, idToken);
        peerReviews.append(reviewEl);
    }
    
    el.feedbackAsync.append(peerReviews);
}

function initFeedback(asgmnt) {
    return async () => {
        const feedback = await getFeedback(asgmnt.workUUID);

        if (feedback) {
            if (feedback.length === 0) {
                el.tabs.disableTab('feedback', 'No feedback recieved yet');
            } else {
                displayFeedback(feedback, asgmnt);
            }

            el.feedbackAsync.finish();
        } else {
            el.feedbackAsync.error();
        }
    };
}

function addFeedbackUI(asgmnt) {
    if (asgmnt.deadline && new Date(asgmnt.deadline) >= new Date()) {
        el.tabs.disableTab('feedback', 'Feedback will be available when the assignment deadline passes');
    } else {
        if (asgmnt.workUUID) {
            el.feedbackAsync = new AsyncElement();
            el.feedback.append(el.feedbackAsync);
            el.tabs.addTabLoadListener('feedback', initFeedback(asgmnt));
        } else {
            el.tabs.disableTab('feedback', asgmnt.deadline
                ? 'Failed to submit work before the deadline'
                : 'Work has not yet been submitted'
            );
        }
    }
}


// Review
// --------------------------------------------
function addReviewUI(asgmnt, className) {
    const peerSubmissions = asgmnt.totalSubmissions - (asgmnt.workUUID ? 1 : 0);
    const reviewsComplete = new ProgressBar(
        asgmnt.peersReviewed,
        asgmnt.minReviews,
        {
            tagName: 'h3',
            text: 'Reviews Complete',
        }
    );
    const likebar = new LikeBar(
        asgmnt.totalReviewLikes,
        asgmnt.totalReviewDislikes,
        {
            tagName: 'h3',
            text: 'Total Likes',
        }
    );

    el.reviewBtn.before(reviewsComplete, likebar);
    el.reviewBtn.href =  `/class/${className}/assignment/${asgmnt.shortName}/peer-review`;
    
    if (asgmnt.deadline && new Date(asgmnt.deadline) >= new Date()) {
        el.tabs.disableTab('review', 'Reviews will open when the assignment deadline passes');
    } else if (
        (asgmnt.reviewsDeadline && new Date(asgmnt.reviewsDeadline) < new Date()) ||
        asgmnt.peersReviewed >= peerSubmissions
    ) {
        el.reviewBtn.remove();
    }
}


// Settings
// --------------------------------------------
/** Check assignment short name is available */
async function checkShortName(asgmntName, className) {
    const response = await fetch(`/api/classes/${className}/assignments/${asgmntName}`, {
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

/** Get request body for updating assignment */
function getAsgmntBody() {
    const body = {
        name: el.asgmntNameInput.value,
        shortName: el.shortNameInput.value,
        anonymous: getRadioValue(el.anonymousInput) === 'true',
        minReviews: parseInt(el.minReviewsInput.value),
        ratingMax: parseInt(el.ratingMaxInput.value),
    };

    if (el.descriptionInput.value) body.description = el.descriptionInput.value;
    if (el.deadlineInput.value) {
        body.deadline = new Date(el.deadlineInput.value).toISOString();
    }
    if (el.reviewsDeadlineInput.value) {
        body.reviewsDeadline = new Date(el.reviewsDeadlineInput.value).toISOString();
    }

    return body;
}

async function updateAsgmt(asgmntName, className) {
    const response = await fetch(`/api/classes/${className}/assignments/${asgmntName}`, {
        credentials: 'same-origin',
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(getAsgmntBody()),
    });

    if (response.ok) {
        hideError(el.settings);
        if (asgmntName !== el.shortNameInput.value) {
            window.location = `/class/${className}/assignment/${el.shortNameInput.value}`;
        } else {
            window.location.reload();
        }
    } else if (response.status === 400) {
        showError(el.settings, 'Invalid data entered');
    } else {
        showError(el.settings);
    }
}

/** Convert ISO timestamp string to datetime-local input format */
function ISOToDatetimeLocal(ISOString) {
    const ts = new Date(ISOString);
    const date = ts.toLocaleDateString('en-CA');
    const time = ts.toLocaleTimeString().slice(0, 5);
    return `${date}T${time}`;
}

function prePopulateSettings(asgmnt) {
    el.asgmntNameInput.value = asgmnt.name;
    el.shortNameInput.value = asgmnt.shortName;
    el.descriptionInput.value = asgmnt.description;
    setRadioValue(el.anonymousInput, `${asgmnt.anonymous}`);
    el.minReviewsInput.value = asgmnt.minReviews;
    el.ratingMaxInput.value = asgmnt.ratingMax;

    if (asgmnt.deadline) {
        el.deadlineInput.value = ISOToDatetimeLocal(asgmnt.deadline);
    }
    if (asgmnt.reviewsDeadline) {
        el.reviewsDeadlineInput.value = ISOToDatetimeLocal(asgmnt.reviewsDeadline);
    }
}

function setupSettingsForm(asgmntName, className) {
    const validation = initForm(el.settings, true);

    validation.addCheck(el.shortNameInput, async (shortName) => {
        if (asgmntName !== shortName) {
            return await checkShortName(shortName, className);
        }
        return '';
    });
    validation.addCheck(el.minReviewsInput, checkPositive);
    validation.addCheck(el.ratingMaxInput, checkPositive);
    validation.addCheck(el.reviewsDeadlineInput, checkReviewsDeadline);

    el.saveBtn.addEventListener('click', async () => {
        const valid = await validation.checkAll();
        if (valid) updateAsgmt(asgmntName, className);
    });
}

async function onDeleteBtnClick(asgmntName, className) {
    const response = await fetch(`/api/classes/${className}/assignments/${asgmntName}`, {
        credentials: 'same-origin',
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` },
    });

    if (response.ok) {
        hideError(el.deleteDialog.section);
        window.location = `/class/${className}`;
    } else {
        showError(el.deleteDialog.section);
    }
}

function addSettingsTab(asgmnt, className) {
    if (asgmnt.isClassOwner) {
        prePopulateSettings(asgmnt);
        setupSettingsForm(asgmnt.shortName, className);
        el.deleteDialogAsgmntName.textContent = asgmnt.name;
        el.deleteBtn.addEventListener('click', () => el.deleteDialog.showModal());
        el.deleteDialogBtn.addEventListener('click', () =>
            onDeleteBtnClick(asgmnt.shortName, className)
        );
    } else {
        el.tabs.removeTab('settings');
    }
}


// Init
// --------------------------------------------
async function onAuthorize(response) {
    idToken = response.id_token;
    const className = window.location.pathname.split('/')[2];
    const asgmntName = window.location.pathname.split('/')[4];
    const asgmnt = await getAssignment(asgmntName, className);

    addDetailsUI(asgmnt, className);
    addReviewUI(asgmnt, className);
    addSettingsTab(asgmnt, className);

    if (asgmnt.workUUID) {
        await addSubmissionUI(asgmnt);
    } else {
        if (asgmnt.deadline && new Date(asgmnt.deadline) < new Date()) {
            el.tabs.disableTab('work', 'Failed to submit work before the deadline');
        } else {
            initSubmitForm(asgmntName, className);
        }
    }

    el.async.finish();

    // Must add feedback tab UI after async has finished otherwise tabs is not
    // constructed yet due to not being in the DOM
    addFeedbackUI(asgmnt);
}

function init() {
    el.async = document.querySelector('await-async');
    el.tabs = document.querySelector('fixed-tabs');
    storeIDElements(el);
    authorize(onAuthorize);
}

window.addEventListener('load', init);
