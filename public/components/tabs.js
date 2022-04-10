/** @module */
export default class Tabs extends HTMLElement {
    constructor() {
        super();
        /** Array that stores each tab's name, nav element and section element,
         * retaining order of insertion */
        this.tabs = [];

        /** Current tab index */
        this.current = 0;
        this.nav = document.createElement('nav');

        // Add tabs set in children
        for (const elem of [...this.children]) {
            if (elem.dataset.tab) {
                this.addTab(elem.dataset.tab, elem);
            }
        }

        // Show first tab, hide remaining
        this.tabs[0].nav.classList.add('active');
        for (let i = 1; i < this.tabs.length; i++) {
            this.tabs[i].section.classList.add('hide');
        }

        this.prepend(this.nav);
    }

    /**
     * Add a tab
     * @param {string} name Tab name to be used on nav
     * @param {Node} section Element to be shown when tab is active
     */
    addTab(name, section) {
        const tab = document.createElement('p');
        tab.textContent = name;
        tab.addEventListener('click', () => this.showTab(name));

        this.nav.append(tab);
        this.tabs.push({ name, nav: tab, section });
    }

    /** Get a tab element from it's name */
    getTab(name) {
        for (const tab of this.tabs) {
            if (tab.name === name) return tab;
        }
    }

    /**
     * Show a tab
     * @param {string} name Name of tab to be shown 
     */
    showTab(name) {
        const current = this.tabs[this.current];
        current.nav.classList.remove('active');
        current.section.classList.add('hide');

        for (let i = 0; i < this.tabs.length; i++) {
            const tab = this.tabs[i];
            if (tab.name === name) {
                tab.nav.classList.add('active');
                tab.section.classList.remove('hide');
                this.current = i;

                if (tab.onload) {
                    tab.onload();
                    delete tab.onload;
                }
                return;
            }
        }
    }

    /**
     * Add a load listener to a tab to be called when the tab is next shown
     * @param {string} name Name of tab to bind load handler
     * @param {function} listener Listener function to be called
     */
    addTabLoadListener(name, listener) {
        const tab = this.getTab(name);
        if (!tab) return;
        tab.onload = listener;
    }

    /**
     * Disable a tab by removing all content and displaying a message
     * @param {string} name Name of tab to disable
     * @param {string} msg Message to be displayed when disabled
     */
    disableTab(name, msg) {
        const tab = this.getTab(name);
        const msgEl = document.createElement('h2');
        msgEl.textContent = msg;
        msgEl.classList.add('subtitle');
        
        for (const elem of [...tab.section.children]) elem.remove();
        tab.section.append(msgEl);
        tab.section.dataset.disabled = true;
    }

    /**
     * Remove a tab
     * @param {string} name Name of tab to be removed
     */
    removeTab(name) {
        for (let i = 0; i < this.tabs.length; i++) {
            const tab = this.tabs[i];
            if (tab.name === name) {
                if (this.current === i) {
                    this.showTab(this.tabs[(i === 0) ? 1 : 0].name);
                }

                tab.nav.remove();
                tab.section.remove();
                this.tabs.splice(i, 1);
                return;
            }
        }
    }
}

customElements.define('fixed-tabs', Tabs);
