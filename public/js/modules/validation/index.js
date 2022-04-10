/** @module */
import { showMsg, removeMsg } from '../dom.js';
import * as core from './core.js';

// Helpers
// --------------------------------------------
function debounce(callback, wait) {
    let timeout;
    return () => {
        clearTimeout(timeout);
        timeout = setTimeout(callback, wait);
    };
}


// Errors
// --------------------------------------------
function showInputError(input, msg) {
    if (input.tagName === 'FIELDSET') {
        input.classList.add('error');
        showMsg(input, msg, 'error');
    } else {
        const label = input.closest('label');
        input.classList.add('error');
        showMsg(label, msg, 'error');
    }
}

function removeInputError(input) {
    if (input.tagName === 'FIELDSET') {
        input.classList.remove('error');
        removeMsg(input, 'error');
    } else {
        const label = input.closest('label');
        input.classList.remove('error');
        removeMsg(label, 'error');
    }
}


// Radio Inputs
// --------------------------------------------
/** Validation check for radio inputs */
function radioCheck(inputs) {
    let checked = false;

    for (const input of inputs) {
        if (input.checked && input.value) {
            checked = true;
        }
    }

    if (!checked) {
        return 'Cannot be Empty';
    }
    return '';
}


// File Inputs
// --------------------------------------------
/** Categorise accepted types into:
 * - Extensions: File extensions
 * - Mimes: MIME types
 * - Base Types: MIME types that accept any subtype
 */
function categoriseAcceptedTypes(input) {
    const split = input.accept.split(',');
    const accept = {
        extensions: [],
        mimes: [],
        baseTypes: [],
    };

    for (const type of split) {
        if (type[0] === '.') {
            accept.extensions.push(type);

        } else if (type[type.length - 1] === '*') {
            accept.baseTypes.push(type.split('/')[0]);

        } else {
            accept.mimes.push(type);
        }
    }

    return accept;
}

/** Validation check for file inputs */
function fileCheck(file, accept) {
    const extension = '.' + file.name.split('.')[1];
    const mime = file.type;

    if (
        accept.extensions.includes(extension) ||
        accept.mimes.includes(mime) ||
        accept.baseTypes.includes(mime.split('/')[0])
    ) {
        return '';
    } else {
        return `Invalid File Type ${extension}`;
    }
}


// Validation
// --------------------------------------------
export default class Validation {
    constructor(parent) {
        /** All validation checks for each input */
        this.checks = new Map();
        this.parent = parent;

        const inputs = parent.querySelectorAll('input:not([type="radio"]), textarea');
        for (const input of inputs) {
            this.#initCheck(input);
            this.#addDefaults(input);
        }

        const radios = parent.querySelectorAll('.radios');
        for (const parent of radios) {
            this.#addRadioChecks(parent);
        }
    }


    // Init
    // --------------------------------------------
    #initCheck(input) {
        input.addEventListener('input', debounce(() => {
            this.check(input);
        }, 300));
    }

    #addDefaults(input) {
        if (input.tagName === 'TEXTAREA') {
            this.addCheck(input, core.types.text);
        } else {
            switch (input.type) {
                case 'file':
                    this.#addFileCheck(input);
                    break;
                default:
                    this.addCheck(input, core.types[input.type]);
            }
        }
    }

    #addRadioChecks(parent) {
        if (parent.dataset.optional !== undefined) return;
        const inputs = parent.querySelectorAll('input');
        this.addCheck(parent, () => radioCheck(inputs));

        for (const input of inputs) {
            input.addEventListener('change', () => this.check(parent));
        }
    }

    #addFileCheck(input) {
        const accept = categoriseAcceptedTypes(input);

        this.addCheck(input, () => {
            for (const file of input.files) {
                const error = fileCheck(file, accept);
                if (error) return error;
            }
            return '';
        });
    }


    // Checks
    // --------------------------------------------
    /**
     * Add a validation check to an input
     * @param {Node} input Input element to add check to
     * @param {function} check A check function that returns an error msg when invalid
     */
    addCheck(input, check) {
        if (this.checks.has(input)) {
            this.checks.get(input).push(check);
        } else {
            this.checks.set(input, [check]);
        }
    }

    /**
     * Run all validation checks on an input, excluding required
     * @returns If all validation checks pass
     */
    async #runChecks(input) {
        let valid = true;

        for (const check of this.checks.get(input)) {
            const error = await check(input.value);
            if (error) {
                valid = false;
                showInputError(input, error);
                break;
            }
        }

        if (valid) {
            removeInputError(input);
            return true;
        }
        return false;
    }

    /**
     * Run all validation checks on an input
     * @returns If all validation checks pass
     */
    async check(input) {
        // Avoid radios as they have their own required check
        if (!input.classList.contains('radios')) {
            const required = input.dataset.optional === undefined;
            const requiredErr = core.required(input.value);
    
            if (required && requiredErr) {
                showInputError(input, requiredErr);
                return false;
            } else if (requiredErr) {
                removeInputError(input);
                return true;
            }
        }

        return await this.#runChecks(input);
    }

    /**
     * Run all validation checks on all inputs
     * @returns If all validation checks pass
     */
    async checkAll() {
        let ok = true;

        for (const input of this.checks.keys()) {
            if (input.dataset.skip !== undefined) continue;
            const valid = await this.check(input);
            if (!valid) ok = false;
        }

        return ok;
    }
}

