/** @module */
import animate from './animate.js';

// Helpers
// --------------------------------------------
/** 
 * Convert kebab case string to camel case
 * @param {string} str Kebab case string
 * @returns {string} Converted camel case string
 */
function kebabToCamelCase(str) {
    const split = str.split('-');
    let newStr = '';

    for (let i = 0; i < split.length; i++) {
        if (i > 0) {
            split[i] = split[i].charAt(0).toUpperCase() + split[i].slice(1);
        }
        newStr += split[i];
    }

    return newStr;
}


// Storing Elements
// --------------------------------------------
/**
 * Store all elements with an id in a given object, converting kebab-case to camelCase
 * @param {object} el Object to store the elements in
 * @param {parent} [parent = document] Parent to query for elements
 */
export function storeIDElements(el, parent = document) {
    const elems = parent.querySelectorAll('[id]');

    for (const elem of elems) {
        el[kebabToCamelCase(elem.id)] = elem;
    }
}


// Adding / Removing Elements
// --------------------------------------------
/**
 * Append a new subtitle to an element
 * @param {Node} elem Parent element to append subtitle to
 * @param {string} txt Subtitle Text
 */
export function addSubtitle(elem, txt) {
    const msg = document.createElement('h2');
    msg.textContent = txt;
    msg.classList.add('subtitle');
    elem.append(msg);
}

/**
 * Append and show a message (p) in an element
 * @param {Node} parent Element to append message to
 * @param {string} txt Message text
 * @param {string} cl CSS class to be added to the message
 * @param  {...string} [moreCls] More CSS classes to be added
 */
export function showMsg(parent, txt, cl, ...moreCls) {
    const cls = [cl, ...moreCls];
    let msg = parent.querySelector('p.' + cls.join('.'));

    if (msg) {
        msg.textContent = txt;
    } else {
        msg = document.createElement('p');
        msg.classList.add(...cls);
        msg.textContent = txt;
        
        animate(parent, 'show-msg', () => {
            parent.append(msg);
            animate(msg, 'fade-in');
        });
    }
}

/**
 * Remove a message from an element
 * @param {Node} parent Element to remove message from
 * @param {string} cl CSS class to identify the message
 * @param  {...string} [moreCls] More CSS classes to identify the message
 */
export function removeMsg(parent, cl, ...moreCls) {
    const cls = [cl, ...moreCls];
    const msg = parent.querySelector('p.' + cls.join('.'));

    if (msg) {
        animate(msg, 'fade-out', () => {
            msg.remove();
            animate(parent, 'hide-msg');
        });
    }
}


// Read More Button
// --------------------------------------------
/**
 * Add text to an element and a read more button if text exceeds a given limit
 * @param {Node} elem Element to add read more button to
 * @param {string} text Text to add to element
 * @param {number} limit Text length limit for truncation
 */
export function addReadMoreBtn(elem, text, limit) {
    if (text.length < limit) {
        elem.textContent = text;
    } else {
        const readMoreBtn = document.createElement('a');
        readMoreBtn.classList.add('read-more');
        readMoreBtn.textContent = 'Read more';

        const truncated = text.substring(0, limit);
        elem.classList.add('truncated');
        elem.textContent = truncated;

        let closed = true;
        readMoreBtn.addEventListener('click', () => {
            if (closed) {
                elem.textContent = text;
                readMoreBtn.textContent = 'Show less';
                closed = false;
            } else {
                elem.textContent = truncated;
                readMoreBtn.textContent = 'Read more';
                closed = true;
            }
        });
    
        elem.after(readMoreBtn);
    }
}
