import BetterElement from '/components/better-element.js';

const template = document.createElement('template');
template.innerHTML = `
    <link href="/components/cards/class/style.css" rel="stylesheet" type="text/css">
    <a id="link" href="#">
        <article class="card">
            <section id="details">
                <img id="avatar">
                <section>
                    <header>
                        <h2 id="name"></h2>
                    </header>
                    <h4 id="short-name" class="subtitle"></h4>
                    <p id="description"></p>
                </section>
            </section>
            <section id="stats">
                <p id="assignments"></p>
                <p id="members"></p>
                <h4 id="owner" class="chip">Owner</h4>
            </section>
        </article>
    </a>
`;

export default class ClassCard extends BetterElement {
    constructor(cl) {
        super();
        const clone = template.content.cloneNode(true);
        this.storeIDElements(clone);

        this.el.link.href = `/class/${cl.shortName}`;
        this.el.avatar.src = cl.avatarUrl;
        this.el.name.textContent = cl.name;
        if (!cl.isOwner) this.el.owner.remove();
        this.el.shortName.textContent = cl.shortName;
        this.el.description.textContent = cl.description;

        if (cl.members === 1) {
            this.el.members.textContent = '1 Member';
        } else {
            this.el.members.textContent = `${cl.members} Members`;
        }

        if (cl.assignments === 1) {
            this.el.assignments.textContent = '1 Assignment';
        } else {
            this.el.assignments.textContent = `${cl.assignments} Assignments`;
        }

        const shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.append(clone);
    }
}

customElements.define('class-card', ClassCard);
