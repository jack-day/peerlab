import { authorize } from '/js/modules/gapi.js';
import { addSubtitle } from '/js/modules/dom.js';
import ClassCard from '/components/cards/class/index.js';

const el = {};

// Get Classes
// --------------------------------------------
async function getClasses(idToken) {
    const response = await fetch('/api/classes', {
        credentials: 'same-origin',
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
    });

    if (response.ok) {
        const classes = await response.json();

        if (classes.length > 0) {
            for (const cl of classes) {
                const card = new ClassCard(cl);
                el.classes.append(card);
            }
        } else {
            addSubtitle(el.main, 'No Classes Found');
        }

        el.async.finish();
    } else if (response.status === 401) {
        window.location = '/404';
    } else {
        el.async.error();
    }
}


// Init
// --------------------------------------------
function init() {
    el.async = document.querySelector('await-async');
    el.main = document.querySelector('main');
    el.classes = document.querySelector('#classes');

    authorize((response) => {
        const idToken = response.id_token;
        getClasses(idToken);
    });
}

window.addEventListener('load', init);
