/** @module */
import { showMsg, removeMsg } from './dom.js';
import { slugify, shortName as validShortName } from './validation/core.js';
import Validation from './validation/index.js';

// Optional Labels
// --------------------------------------------
/** Add '(optional)' text to an element */
function addOptionalText(elem) {
    const text = elem.childNodes[0];
    const hasText = !text.tagName;

    const optional = document.createElement('span');
    optional.classList.add('optional');
    optional.textContent = '(optional)';

    if (hasText) {
        text.after(' ', optional);
    } else {
        elem.prepend(optional);
    }
}

/** Add '(optional)' label to an input's label */
function addOptionalLabel(input) {
    const label = input.closest('label');
    if (label) addOptionalText(label);
}

/** Add '(optional)' label to a fieldset's legend */
function addOptionalLegend(fieldset) {
    const legend = fieldset.querySelector('legend');
    if (legend) addOptionalText(legend);
}


// Accelerators
// --------------------------------------------
/**
 * Bind an input to slugify itself into another input
 * @param {Node} regular Input to get value from
 * @param {Node} slug Input to put slugified value into
 * @param {Validation} [validation] Instance of validation to add slug check
 */
export function slugifyInput(regular, slug, validation) {
    regular.addEventListener('input', () => {
        const slugged = slugify(regular.value);
        slug.value = slugged;

        const trigger = new Event('input', { bubbles: true });
        slug.dispatchEvent(trigger);
    });

    if (validation) {
        validation.addCheck(slug, validShortName);
    }
}


// Errors
// --------------------------------------------
/** Add an error message to a given form */
export function showError(form, msg = 'We ran into an error, please try again later') {
    showMsg(form, msg, 'notice', 'submit', 'error');
}

/** Hide an error message from a given form */
export function hideError(form) {
    removeMsg(form, 'notice', 'submit', 'error');
}


// File Inputs
// --------------------------------------------
function shortenFilename(filename) {
    const split = filename.split('.');
    const shortened = split[0].substring(0, 20);
    const extension = split[split.length - 1];
    return `${shortened}...${extension}`;
}

/** File input change event handler to display filename preview */
function filenameChange(input, btn) {
    if (input.files.length > 0) {
        let filename = input.files[0].name;

        if (input.files.length > 1) {
            filename = 'Multiple Files Selected';
        } else if (filename.length > 25) {
            filename = shortenFilename(filename);
        }

        btn.textContent = filename;
        btn.classList.add('active');
    } else {
        btn.textContent = 'Upload File...';
        btn.classList.remove('active');
    }
}

function initFileInput(input) {
    const br = document.createElement('br');
    const span = document.createElement('span');
    span.textContent = 'Upload File...';
    span.ariaLabel = 'Upload File';
    
    input.before(br);
    input.after(span);
    input.addEventListener('change', () => filenameChange(input, span));
}


// Radio Inputs
// --------------------------------------------
function initRadios(parent) {
    if (parent.dataset.optional !== undefined) addOptionalLegend(parent);
    const labels = parent.querySelectorAll('label');
    
    for (let i = 0; i < labels.length; i++) {
        const input = labels[i].querySelector('input[type="radio"]');
        if (input.checked) labels[i].classList.add('active');
        
        input.addEventListener('change', () => {
            for (let j = 0; j < labels.length; j++) {
                labels[j].classList.toggle('active', j === i);
            }
        });
    }
}

/**
 * Get value from radio inputs
 * @param {Node} parent Parent fieldset of radio inputs
 * @returns Value of checked radio input
 */
export function getRadioValue(parent) {
    const radios = parent.querySelectorAll('input[type="radio"]');
    for (const radio of radios) {
        if (radio.checked) return radio.value;
    }
}

/**
 * Set the checked value for radio inputs
 * @param {Node} parent Parent fieldset of radio inputs
 * @param {string} value Value of input to be set as checked
 */
export function setRadioValue(parent, value) {
    const labels = parent.querySelectorAll('label');
    
    for (const label of labels) {
        const input = label.querySelector('input[type="radio"]');
        input.checked = input.value === value;
        label.classList.toggle('active', input.value === value);
    }
}


// Init
// --------------------------------------------
/** Initialise form and events */
export default function initForm(parent, validation = false) {
    const inputs = parent.querySelectorAll('input:not([type="radio"]), textarea');
    const radios = parent.querySelectorAll('.radios');

    for (const input of inputs) {
        if (input.dataset.optional !== undefined) addOptionalLabel(input);
        if (input.type === 'file') initFileInput(input);
    }
    for (const parent of radios) initRadios(parent);

    if (validation) return new Validation(parent);
}
