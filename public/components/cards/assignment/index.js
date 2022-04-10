/** @module */
import BetterElement from '/components/better-element.js';
import LinearProgress from '/components/progress-indicator/linear/index.js';

const template = document.createElement('template');
template.innerHTML = `
    <link href="/components/cards/assignment/style.css" rel="stylesheet" type="text/css">
    <a id="link" href="#">
        <article class="card">
            <h1 id="name"></h2>
            <h3 id="short-name" class="subtitle"></h3>
            <div id="deadlines">
                <p id="deadline"></p>
                <p id="reviews-deadline"></p>
            </div>
            <p id="description"></p>
            <div id="stats">
                <p id="status"></p>
            </div>
        </article>
    </a>
`;

export default class AssignmentCard extends BetterElement {
    constructor(asgmnt, className) {
        super();
        const clone = template.content.cloneNode(true);
        this.storeIDElements(clone);
        
        this.#addValues(asgmnt, className);

        const shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.append(clone);
    }


    // Deadlines
    // --------------------------------------------
    /** Insert values into card elements */
    #addValues(asgmnt, className) {
        this.el.link.href = `/class/${className}/assignment/${asgmnt.shortName}`;
        this.el.name.textContent = asgmnt.name;
        this.el.shortName.textContent = asgmnt.shortName;
        this.#addDeadline(this.el.deadline, asgmnt.deadline, 'No Deadline');
        this.#addDeadline(this.el.reviewsDeadline, asgmnt.reviewsDeadline, 'No Reviews Deadline');
        this.el.description.textContent = asgmnt.description || '';
        this.changeStatus(asgmnt.workUUID, asgmnt.deadline);

        const progressBar = new LinearProgress(
            asgmnt.peersReviewed,
            asgmnt.minReviews,
            { text: 'Reviews Complete' }
        );
        this.el.stats.append(progressBar);
    }

    /** Add deadline to card or remove if no value */
    #addDeadline(elem, deadline, nullText) {
        if (deadline) {
            elem.textContent = new Date(deadline).toLocaleString();
        } else {
            elem.textContent = nullText;
        }
    }
    

    // State
    // --------------------------------------------
    /** Change submission status */
    changeStatus(workUUID, deadline) {
        this.el.status.classList.value = '';

        if (workUUID) {
            this.el.status.textContent = 'Submitted';
            this.el.status.classList.add('submitted');
        } else {
            if (deadline && new Date(deadline) < new Date()) {
                this.el.status.textContent = 'Missed';
                this.el.status.classList.add('missed');
            } else {
                this.el.status.textContent = 'Unsubmitted';
            }
        }
    }
}

customElements.define('assignment-card', AssignmentCard);
