import LinearProgress from '../progress-indicator/linear/index.js';

export default class LikeBar extends LinearProgress {
    constructor(likes, dislikes, caption) {
        const max = likes + dislikes;
        super(max - dislikes, max);

        const stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.type = 'text/css';
        stylesheet.href = '/components/like-bar/style.css';
        this.shadowRoot.append(stylesheet);

        const captionEl = document.createElement(caption.tagName ?? 'p');
        captionEl.id = 'caption';
        captionEl.textContent = caption.text;

        const likesEl = document.createElement('span');
        likesEl.classList.add('likes');
        likesEl.textContent = likes;

        const dislikesEl = document.createElement('span');
        dislikesEl.classList.add('dislikes');
        dislikesEl.textContent = dislikes;

        captionEl.append(likesEl, dislikesEl);
        this.el.track.before(captionEl);
    }
}

customElements.define('like-bar', LikeBar);
