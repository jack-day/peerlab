const template = document.createElement('template');
template.innerHTML = `
    <link href="/components/progress-indicator/circular/style.css" rel="stylesheet" type="text/css">
    <svg height="50" width="50">
        <circle cx="25" cy="25" r="20"/>
    </svg>
`;

export default class CircularProgress extends HTMLElement {
    constructor() {
        super();
        const clone = template.content.cloneNode(true);
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.append(clone);
    }
}

customElements.define('circular-progress-indicator', CircularProgress);
