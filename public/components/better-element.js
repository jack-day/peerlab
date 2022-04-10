/** @module */
import { storeIDElements } from '/js/modules/dom.js';

/** Adds extra functionality to HTMLElement */
export default class BetterElement extends HTMLElement {
    constructor() {
        super();
        /** Collection of DOM elements */
        this.el = {};
    }

    /** Store all elements with an id in this.el */
    storeIDElements(parent) {
        storeIDElements(this.el, parent);
    }
}
