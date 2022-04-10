import BetterElement from '/components/better-element.js';

const template = document.createElement('template');
template.innerHTML = `
    <link href="/components/progress-indicator/linear/style.css" rel="stylesheet" type="text/css">
    <div id="track">
        <div id="indicator"><div>
    </div>
`;

export default class LinearProgress extends BetterElement {
    constructor(value, max, caption) {
        super();
        const clone = template.content.cloneNode(true);
        this.storeIDElements(clone);

        this.value = value;
        this.max = max;
        this.el.indicator.style = `--progress: ${(value / max) * 100}%`;

        if (caption) {
            const captionEl = document.createElement(caption.tagName ?? 'p');
            const captionValue = caption.percentage
                ? `${(value / max) * 100}%`
                : `${value}/${max}`;

            if (caption.prepend) {
                captionEl.textContent = `${caption.text} ${captionValue}`;
            } else {
                captionEl.textContent = `${captionValue} ${caption.text}`;
            }

            captionEl.id = 'caption';
            this.caption = caption;
            this.el.caption = captionEl;
            this.el.track.before(captionEl);
        }

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.append(clone);
    }

    updateValue(value) {
        this.el.indicator.style = `--progress: ${(value / this.max) * 100}%`;
        this.value = value;

        if (this.caption) {
            this.el.caption.textContent = `${value}/${this.max} ${this.caption.text}`;
        }
    }
}

customElements.define('linear-progress-indicator', LinearProgress);
