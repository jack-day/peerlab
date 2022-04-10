/** @module */
import CircularProgress from '/components/progress-indicator/circular/index.js';

/**
 * Element that is reliant on an async task
 * - Hides all children and displays them again when async task is complete
 * - Shows a loader until async task is complete
 * - Displays an error message if error occurs
 */
export default class AsyncElement extends HTMLElement {
    static get observedAttributes() { return ['data-state']; }

    constructor() {
        super();
        this.loaded = false;
        this.dataset.state = 'init';

        // Hide content
        for (const elem of this.children) {
            elem.classList.add('hide');
        }

        // Add loader
        this.loader = new CircularProgress();
        this.append(this.loader);

        this.dataset.state = 'loading';
    }

    // State Change
    // --------------------------------------------
    finish() {
        if (this.dataset.state === 'loading' && !this.loaded) {
            this.dataset.state = 'loaded';
            this.loaded = true;
            this.loader.remove();
            for (const elem of this.children) {
                elem.classList.remove('hide');
            }
        }
    }

    error(msg = 'We ran into an error, please try again later') {
        if (this.dataset.state === 'loading' && !this.loaded) {
            this.dataset.state = 'error';
            this.loaded = true;
            this.loader.remove();

            const errorMsg = document.createElement('p');
            errorMsg.classList.add('notice', 'error');
            errorMsg.textContent = msg;
            this.append(errorMsg);
        }
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === 'data-state' && oldVal === 'loading' && !this.loaded) {
            if (newVal === 'loaded') {
                this.finish();
            } else if (newVal === 'error') {
                this.error();
            }
        }
    }


    // Default HTMLElement function compatability
    // --------------------------------------------
    append(...nodes) {
        for (const node of nodes) {
            if (this.dataset.state === 'loading' && !this.loaded) {
                if (node instanceof DocumentFragment) {
                    for (const child of node.children) {
                        child.classList.add('hide');
                    }
                } else {
                    node.classList.add('hide');
                }
            }
            super.append(node);
        }
    }
}

customElements.define('await-async', AsyncElement);
