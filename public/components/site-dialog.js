import animate from '/js/modules/animate.js';

export class SiteDialog extends HTMLDialogElement {
    constructor() {
        super();

        const section = document.createElement('section');
        for (const elem of [...this.children]) {
            section.append(elem);
        }

        const closeBtn = document.createElement('img');
        closeBtn.src = '/assets/icons/clear.svg';
        closeBtn.classList.add('close');
        closeBtn.addEventListener('click', () => {
            animate(this, 'fade-out', () => this.close());
        });

        section.append(closeBtn);
        this.append(section);
        this.section = section;
    }

    showModal() {
        super.showModal();
        animate(this, 'fade-in');
    }
}

customElements.define('site-dialog', SiteDialog, { extends: 'dialog' });
