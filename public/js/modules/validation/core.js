/** @module */
// Helpers
// --------------------------------------------
export function slugify(str) {
    let words = str.split(/[^a-zA-Z0-9]/g);     // Split string on any non-alphanumeric chars
    words = words.filter(word => word !== '');  // Remove all empty elements
    return words.join('-').toLowerCase();       // Slugify and make lower case
}


// Validation
// --------------------------------------------
export function required(value) {
    if (value === '' || typeof value === 'undefined') {
        return 'Cannot be Empty';
    }
    return '';
}

export function shortName(val) {
    if (val.match(/[^a-z0-9-]/g)) {
        return 'Must be lowercase with spaces replaced by hyphens';
    }
    return '';
}

export function uuid(val) {
    // Regex Source: https://github.com/uuidjs/uuid/blob/1c849da6e164259e72e18636726345b13a7eddd6/src/regex.js
    const regex = /(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)/;

    // Version extraction source: https://github.com/uuidjs/uuid/blob/1c849da6e164259e72e18636726345b13a7eddd6/src/version.js
    const version = parseInt(val.substr(14, 1), 16);

    if (!val.match(regex) || version !== 4) {
        return `Not a valid v4 UUID`;
    }
    return '';
}

export function url(val) {
    try {
        new URL(val);
        return '';
    } catch (e) {
        return 'Not a valid URL';  
    }
}

export function nonNegative(val) {
    if (val < 0) {
        return 'Must be non-negative';
    }
    return '';
}

export function positive(val) {
    if (val < 1) {
        return 'Must be positive';
    }
    return '';
}

export function futureTimestamp(val) {
    if (new Date(val) < new Date()) {
        return 'Must be a future timestamp';
    }
    return '';
}


// Type Validation
// --------------------------------------------
export const types = {
    'text': (txt) => {
        if (typeof txt !== 'string') {
            return 'Not text';
        }
        return '';
    },
    'number': (num) => {
        if (num.match(/[^\d]/g)) {
            return 'Not a valid number';
        }
        return '';
    },
    'datetime-local': (datetime) => {
        if (isNaN(Date.parse(datetime))) {
            return 'Not a valid date/time';  
        }
        return '';
    },
};
