import { authorize } from '/js/modules/gapi.js';
import { storeIDElements, showMsg, removeMsg  } from '/js/modules/dom.js';

let idToken;
const el = {};

// Accept Invite
// --------------------------------------------
async function acceptInvite(invite) {
    const response = await fetch(`/api/invites/${invite.uuid}`, {
        credentials: 'same-origin',
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
    });

    if (response.ok) {
        removeMsg(el.main, 'notice', 'error');
        window.location = `/class/${invite.class.shortName}`;
    } else {
        showMsg(
            el.main,
            'Error accepting invite, please try again',
            'notice', 'error'
        );
    }
}


// Invite Details
// --------------------------------------------
async function getInvite(uuid) {
    const response = await fetch(`/api/invites/${uuid}`, {
        credentials: 'same-origin',
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
    });

    if (response.ok) {
        return await response.json();
    } else if ([400, 401, 404].includes(response.status)) {
        window.location = '/404';
    } else {
        el.async.error();
    }
}

function addInviteUI(invite) {
    el.avatar.src = invite.class.avatarUrl;
    el.name.textContent = invite.class.name;
    el.members.textContent = `${invite.class.members} Members`;
    el.assignments.textContent = `${invite.class.assignments} Assignments`;

    if (invite.class.isMember) {
        el.acceptBtn.textContent = 'Joined';
        el.acceptBtnLink.href = `/class/${invite.class.shortName}`;
    } else {
        el.acceptBtn.addEventListener('click', () => acceptInvite(invite));
    }
}


// Init
// --------------------------------------------
function init() {
    el.async = document.querySelector('await-async');
    el.main = document.querySelector('main');
    storeIDElements(el);
    authorize(async (response) => {
        idToken = response.id_token;
        const inviteUUID = window.location.pathname.replace('/invite/', '');
        const invite = await getInvite(inviteUUID);
        if (invite) {
            addInviteUI(invite);
            el.async.finish();
        }
    });
}

window.addEventListener('load', init);

