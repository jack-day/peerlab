import { authorizeRegistered } from '/js/modules/gapi.js';
import { storeIDElements } from '/js/modules/dom.js';
import initForm, { slugifyInput, showError, hideError } from '/js/modules/forms.js';

const el = {};

// Short Name Check
// --------------------------------------------
async function checkShortName(idToken, shortName) {
    const response = await fetch(`/api/classes/${shortName}/short-name`, {
        credentials: 'same-origin',
        method: 'GET',
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


// Create Class
// --------------------------------------------
async function createClass(idToken) {
    const response = await fetch(`/api/classes`, {
        credentials: 'same-origin',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: el.className.value,
            shortName: el.shortName.value,
            description: el.description.value,
        }),
    });

    if (response.ok) {
        hideError(el.form);
        window.location = `/class/${el.shortName.value}`;
    } else if (response.status === 400) {
        showError(el.form, 'Invalid data entered');
    } else {
        showError(el.form);
    }
}


// Init
// --------------------------------------------
function setup(idToken) {
    const validation = initForm(el.form, true);
    slugifyInput(el.className, el.shortName, validation);

    validation.addCheck(el.shortName, async (shortName) => {
        return await checkShortName(idToken, shortName);
    });

    el.createBtn.addEventListener('click', async () => {
        const valid = await validation.checkAll();
        if (valid) {
            createClass(idToken, validation);
        }
    });
}


function init() {
    el.async = document.querySelector('await-async');
    el.form = document.querySelector('form');
    storeIDElements(el);
    authorizeRegistered((response) => {
        if (!response.error) {
            setup(response.id_token);
            el.async.finish();
        } else {
            window.location = '/404';
        }
    });
}

window.addEventListener('load', init);
