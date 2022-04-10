/** @module */
import { authorize } from '/js/modules/gapi.js';
import { storeIDElements, showMsg, removeMsg, addReadMoreBtn } from '/js/modules/dom.js';
import initForm, { showError, hideError } from '/js/modules/forms.js';
import AsyncElement from '/components/async.js';
import AssignmentCard from '/components/cards/assignment/index.js';

let idToken;
const el = {};

// Class
// --------------------------------------------
async function getClass(className) {
    const response = await fetch(`/api/classes/${className}`, {
        credentials: 'same-origin',
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
    });

    if (response.ok) {
        return await response.json();
    } else if (response.status === 401 || response.status === 404) {
        window.location = '/404';
    } else {
        el.async.error();
    }
}

function addDetailsUI(cl) {
    el.avatar.src = cl.avatarUrl;
    el.name.textContent = cl.name;
    if (!cl.isOwner) el.owner.remove();
    el.shortName.textContent = cl.shortName;
    
    if (cl.description) {
        addReadMoreBtn(el.description, cl.description, 550);
    } else {
        el.description.remove();
    }
}


// Assignments
// --------------------------------------------
async function getAssignments(className) {
    const response = await fetch(`/api/classes/${className}/assignments`, {
        credentials: 'same-origin',
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
    });

    if (response.ok) {
        return await response.json();
    } else {
        el.async.error();
    }
}

function disableAssignmentsTab(cl) {
    el.tabs.disableTab('assignments', 'No Assignments Found');
    
    if (cl.isOwner) {
        el.newAssignmentBtn.href = `/class/${cl.shortName}/new/assignment/`;
        const assignmentsTab = el.tabs.getTab('assignments');
        assignmentsTab.section.append(el.newAssignmentBtn);
    }

    el.newAssignment.remove();
}

function addAssignmentsTab(asgmts, cl) {
    if (asgmts.length > 0) {
        if (cl.isOwner) {
            el.newAssignmentBtn.href = `/class/${cl.shortName}/new/assignment/`;
        } else {
            el.newAssignment.remove();
        }

        for (const asgmt of asgmts) {
            el.assignments.append(new AssignmentCard(asgmt, cl.shortName));
        }
    } else {
        disableAssignmentsTab(cl);
    }
}


// Invite Members
// --------------------------------------------
async function getInviteLink(className) {
    const response = await fetch(`/api/classes/${className}/invites`, {
        credentials: 'same-origin',
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
    });

    if (response.ok) {
        return await response.json();
    }
}

function bindInviteEvents(className) {
    el.inviteBtn.addEventListener('click', async () => {
        const invite = await getInviteLink(className);
        if (invite) {
            removeMsg(el.inviteMembers, 'notice', 'error');
            el.inviteInput.value = window.location.origin + invite;
            el.inviteDialog.showModal();
            el.inviteInput.focus();
            el.inviteInput.select();
        } else {
            showMsg(
                el.inviteMembers,
                'Error generating invite link, please try again',
                'notice', 'error'
            );
        }
    });
    
    el.inviteCopyBtn.addEventListener('click', () => {
        el.inviteInput.select();
        document.execCommand('copy');
        el.inviteCopyBtn.textContent = 'Copied';
        setTimeout(() => el.inviteCopyBtn.textContent = 'Copy', 3000);
    });
}


// Members
// --------------------------------------------
async function getMembers(className) {
    const response = await fetch(`/api/classes/${className}/members`, {
        credentials: 'same-origin',
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
    });

    if (response.ok) {
        return await response.json();
    }
}

async function deleteMember(memberUUID, className) {
    const response = await fetch(`/api/classes/${className}/members/${memberUUID}`, {
        credentials: 'same-origin',
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
    });

    return response.ok;
}

function sortMembers(a, b) {
    const nameA = a.firstName.toUpperCase();
    const nameB = b.firstName.toUpperCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
}

function showDeleteMemberDialog(member, elem, className) {
    const dialog = document.querySelector('#remove-member');
    const section = dialog.querySelector('section');
    const p = dialog.querySelector('p');
    const btn = dialog.querySelector('button');

    p.textContent = `Are you sure you want to remove ${member.firstName} ${member.lastName}?`;
    btn.onclick = async () => {
        const deleted = await deleteMember(member.uuid, className);
        if (deleted) {
            hideError(section);
            elem.remove();
            dialog.close();
        } else {
            showError(section);
        }
    };

    dialog.showModal();
}

function createMemberElem(member, cl = {}) {
    const elem = document.createElement('article');
    const img = document.createElement('img');
    const name = document.createElement('h3');

    elem.classList.add('member');
    img.src = member.avatarUrl;
    name.textContent = `${member.firstName} ${member.lastName}`;
    elem.append(img, name);

    if (cl.isOwner) {
        const deleteMemberBtn = document.createElement('img');
        deleteMemberBtn.classList.add('delete-member');
        deleteMemberBtn.src = '/assets/icons/delete.svg';
        deleteMemberBtn.ariaLabel = `Delete ${member.firstName} ${member.lastName}`;
        deleteMemberBtn.addEventListener('click', () =>
            showDeleteMemberDialog(member, elem, cl.shortName)
        );
        elem.append(deleteMemberBtn);
    }

    return elem;
}

function createOwnerElem(member) {
    const elem = createMemberElem(member);
    const ownerElem = document.createElement('h4');
    ownerElem.classList.add('chip');
    ownerElem.textContent = 'Owner';
    elem.append(ownerElem);
    return elem;
}

function addMembersUI(members, cl, elem) {
    const ownerIndex = members.findIndex(member => member.uuid === cl.ownerUUID);
    const owner = members[ownerIndex];
    members.splice(ownerIndex, 1);
    members.sort(sortMembers);

    if (cl.isOwner) {
        bindInviteEvents(cl.shortName);
    } else {
        el.inviteMembers.remove();
    }
    
    elem.append(createOwnerElem(owner));
    for (const member of members) {
        elem.append(createMemberElem(member, cl));
    }
}

function addMembersTab(cl) {
    const async = new AsyncElement();
    el.members.append(async);

    el.tabs.addTabLoadListener('members', async () => {
        const members = await getMembers(cl.shortName);
        if (members) {
            addMembersUI(members, cl, async);
            async.finish();
        } else {
            async.error();
        }
    });
}


// Settings
// --------------------------------------------
/** Check class short name is available */
async function checkShortName(shortName) {
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

/** Update avatar API call */
async function updateAvatar(className) {
    const formData = new FormData();
    formData.append('avatar', el.avatarInput.files[0]);

    const response = await fetch(`/api/classes/${className}/avatar`, {
        credentials: 'same-origin',
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: formData,
    });

    if (response.ok) {
        hideError(el.avatarSettings);
        window.location.reload();
    } else if (response.status === 400) {
        showError(el.avatarSettings, 'Invalid file upload');
    } else {
        showError(el.avatarSettings);
    }
}

/** Update class API call */
async function updateClass(className) {
    const response = await fetch(`/api/classes/${className}`, {
        credentials: 'same-origin',
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: el.classNameInput.value,
            shortName: el.shortNameInput.value,
            description: el.descriptionInput.value,
        }),
    });

    if (response.ok) {
        hideError(el.settings);
        if (className !== el.shortNameInput.value) {
            window.location = `/class/${el.shortNameInput.value}`;
        } else {
            window.location.reload();
        }
    } else if (response.status === 400) {
        showError(el.settings, 'Invalid data entered');
    } else {
        showError(el.settings);
    }
}

/** Delete class API call for dialog delete button */
async function deleteClass(className) {
    const response = await fetch(`/api/classes/${className}`, {
        credentials: 'same-origin',
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` },
    });

    if (response.ok) {
        hideError(el.deleteDialog.section);
        window.location = `/classes`;
    } else {
        showError(el.deleteDialog.section);
    }
}

function setupAvatarSettingsForm(className) {
    const validation = initForm(el.avatarSettings, true);
    el.saveAvatarBtn.addEventListener('click', async () => {
        const valid = await validation.checkAll();
        if (valid) updateAvatar(className);
    });
}

function prePopulateSettings(cl) {
    el.classNameInput.value = cl.name;
    el.shortNameInput.value = cl.shortName;
    if (cl.description) {
        el.descriptionInput.value = cl.description;
    }
}

function setupSettingsForm(className) {
    const validation = initForm(el.settings, true);

    validation.addCheck(el.shortNameInput, async (shortName) => {
        if (className !== shortName) {
            return await checkShortName(shortName);
        }
        return '';
    });

    el.saveBtn.addEventListener('click', async () => {
        const valid = await validation.checkAll();
        if (valid) updateClass(className);
    });
}

function addSettingsTab(cl) {
    if (cl.isOwner) {
        setupAvatarSettingsForm(cl.shortName);
        prePopulateSettings(cl);
        setupSettingsForm(cl.shortName);
        el.deleteDialogClassName.textContent = cl.name;
        el.deleteBtn.addEventListener('click', () => el.deleteDialog.showModal());
        el.deleteDialogBtn.addEventListener('click', () =>
            deleteClass(cl.shortName)
        );
    } else {
        el.tabs.removeTab('settings');
    }
}


// Init
// --------------------------------------------
async function onAuthorize(response) {
    idToken = response.id_token;
    const className = window.location.pathname.replace('/class/', '');

    const cl = await getClass(className);
    if (!cl) return;

    const asgmts = await getAssignments(className);
    if (!asgmts) return;

    addDetailsUI(cl);
    addAssignmentsTab(asgmts, cl);
    addMembersTab(cl);
    addSettingsTab(cl);
    el.async.finish();
}

function init() {
    el.async = document.querySelector('await-async');
    el.tabs = document.querySelector('fixed-tabs');
    storeIDElements(el);
    authorize(onAuthorize);
}

window.addEventListener('load', init);
