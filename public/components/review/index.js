/** @module */
import BetterElement from '../better-element.js';
import { addReadMoreBtn } from '/js/modules/dom.js';

const template = document.createElement('template');
template.innerHTML = `
    <link href="/components/review/style.css" rel="stylesheet" type="text/css">
    <section class="review">
        <img id="avatar">
        <section>
            <header>
                <h3 id="name"></h3>
                <p id="create-time"></p>
            </header>
            <p id="rating"></p>
            <p id="feedback"></p>
            <div>
                <a id="like-btn">
                    <img src="/assets/icons/thumb-up.svg">
                </a>
                <a id="dislike-btn">
                    <img src="/assets/icons/thumb-down.svg">
                </a>
            </div>
        </section>
    </section>
`;

/** Calculate time ago from timestamp and return display string */ 
function timeAgo(timestamp) {
    const ms = new Date() - new Date(timestamp);
    const secs = Math.floor(ms / 1000);
    if (secs < 5) return 'Just Now';
    if (secs < 60) return `${secs} seconds ago`;

    const mins = Math.floor(secs / 60);
    if (mins < 2) return '1 minute ago';
    if (mins < 60) return `${mins} minutes ago`;

    const hours = Math.floor(mins / 60);
    if (hours < 2) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 2) return '1 day ago';
    if (days < 7) return `${days} days ago`;

    if (days < 7 * 2) return '1 week ago';
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;

    if (days < 30 * 2) return '1 month ago';
    if (days < 365) return `${Math.floor(days / 30)} months ago`;

    if (days < 365 * 2) return '1 year ago';
    return `${Math.floor(days / 365)} years ago`;
}

export default class Review extends BetterElement {
    constructor(review, asgmnt, idToken) {
        super();
        this.review = review;
        this.asgmnt = asgmnt;
        this.idToken = idToken;
        
        const clone = template.content.cloneNode(true);
        this.storeIDElements(clone);

        this.el.avatar.src = review.user.avatarUrl;
        this.el.name.textContent = `${review.user.firstName} ${review.user.lastName}`;
        this.el.createTime.textContent = timeAgo(review.createTime);
        this.el.rating.textContent = `${review.rating}/${asgmnt.ratingMax}`;
        addReadMoreBtn(this.el.feedback, review.feedback, 550);

        this.#initLikeBtns();
        this.baseAPIPath = `/api/work/${this.asgmnt.workUUID}/reviews/${this.review.user.uuid}`;

        const shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.append(clone);
    }
    

    // Like and Dislike
    // --------------------------------------------
    async like() {
        const response = await fetch(`${this.baseAPIPath}/likes`, {
            credentials: 'same-origin',
            method: 'PUT',
            headers: { Authorization: `Bearer ${this.idToken}` },
        });
        
        if (response.ok) {
            this.review.liked = true;
            this.el.dislikeBtn.classList.remove('active');
            this.el.likeBtn.classList.add('active');
        }
    }

    async deleteLike() {
        const response = await fetch(`${this.baseAPIPath}/likes`, {
            credentials: 'same-origin',
            method: 'DELETE',
            headers: { Authorization: `Bearer ${this.idToken}` },
        });

        if (response.ok) {
            delete this.review.liked;
            this.el.likeBtn.classList.remove('active');
        }
    }

    async dislike() {
        const response = await fetch(`${this.baseAPIPath}/dislikes`, {
            credentials: 'same-origin',
            method: 'PUT',
            headers: { Authorization: `Bearer ${this.idToken}` },
        });
        
        if (response.ok) {
            this.review.liked = false;
            this.el.likeBtn.classList.remove('active');
            this.el.dislikeBtn.classList.add('active');
        }
    }

    async deleteDislike() {
        const response = await fetch(`${this.baseAPIPath}/dislikes`, {
            credentials: 'same-origin',
            method: 'DELETE',
            headers: { Authorization: `Bearer ${this.idToken}` },
        });

        if (response.ok) {
            delete this.review.liked;
            this.el.dislikeBtn.classList.remove('active');
        }
    }

    /** Setup like button event handlers and classes */
    #initLikeBtns() {
        this.el.likeBtn.addEventListener('click', () => {
            if (this.review.liked) {
                this.deleteLike();
            } else {
                this.like();
            }
        });
        
        this.el.dislikeBtn.addEventListener('click', () => {
            if (this.review.liked === false) {
                this.deleteDislike();
            } else {
                this.dislike();
            }
        });

        if (this.review.liked) {
            this.el.likeBtn.classList.add('active');
        } else if (this.review.liked === false) {
            this.el.dislikeBtn.classList.add('active');
        }
    }
}

customElements.define('feedback-review', Review);
