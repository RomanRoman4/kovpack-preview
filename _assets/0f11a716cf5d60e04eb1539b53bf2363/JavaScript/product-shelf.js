(() => {
"use strict";
// "Regal" (shelf) view of the product cards and the Rollen/Regal switch.
// Each product record ships its shelf item and the switch in inert <template>
// elements; consecutive product records become one shelf placed before them.
// The chosen view is kept per visitor; #regal or #rollen at the end of the URL
// selects it directly (handy for sharing the design preview). A fragment, not a
// query parameter, because TYPO3 answers unknown parameters without cHash with 404.
const STORAGE_KEY = 'kovpack-products-view';
const VIEWS = ['rolls', 'shelf'];
const URL_VIEWS = { rollen: 'rolls', rolls: 'rolls', regal: 'shelf', shelf: 'shelf' };
const stacked = window.matchMedia('(max-width: 1023px)');
const root = document.documentElement;
const switches = [];
const shelves = [];

const readStored = () => {
    try { return window.localStorage.getItem(STORAGE_KEY); } catch { return null; }
};
const store = (view) => {
    try { window.localStorage.setItem(STORAGE_KEY, view); } catch { /* private mode: keep it for this page only */ }
};

// The switch joins the section heading ("Produkte") when one stands right
// before the products; otherwise it sits at the top of whichever block is
// shown. It never gets a component of its own, which would add Camino's full
// section spacing around it.
const setView = (view, remember) => {
    if (!VIEWS.includes(view)) view = 'rolls';
    root.dataset.productsView = view;
    for (const group of switches) {
        const hadFocus = group.control.contains(document.activeElement) ? document.activeElement : null;
        if (!group.heading) (view === 'shelf' ? group.shelfContent : group.rollContent).prepend(group.control);
        hadFocus?.focus();
        for (const option of group.control.querySelectorAll('[data-view]')) option.setAttribute('aria-pressed', String(option.dataset.view === view));
    }
    if (remember) store(view);
};

const activate = (shelf, item) => {
    for (const other of shelf.items) {
        const active = other === item;
        other.classList.toggle('is-active', active);
        other.querySelector('.kovpack-shelf__toggle').setAttribute('aria-expanded', String(active));
    }
    renderInert(shelf);
};

// Closed items keep their details out of the tab order; stacked, all are open.
const renderInert = (shelf) => {
    for (const item of shelf.items) item.querySelector('.kovpack-shelf__content').inert = !stacked.matches && !item.classList.contains('is-active');
};

const sections = [...document.querySelectorAll('.kovpack-product[data-roll]')];
const groups = [];
for (const section of sections) {
    const last = groups.at(-1);
    if (last && last.at(-1).nextElementSibling === section) last.push(section);
    else groups.push([section]);
}

for (const group of groups) {
    const switchTemplate = group[0].querySelector('template[data-shelf-switch]');
    const shelfSection = document.createElement('section');
    shelfSection.className = 'component kovpack-shelf';
    const content = document.createElement('div');
    content.className = 'component__content';
    const row = document.createElement('div');
    row.className = 'kovpack-shelf__row-wrap';
    content.append(row);
    shelfSection.append(content);

    const items = [];
    for (const section of group) {
        const template = section.querySelector('template[data-shelf-item]');
        if (!template) continue;
        const item = template.content.firstElementChild.cloneNode(true);
        items.push(item);
        row.append(item);
    }
    if (!items.length) continue;
    const shelf = { items };

    const rollContent = group[0].querySelector('.component__content');
    if (switchTemplate && rollContent) {
        const control = switchTemplate.content.firstElementChild.cloneNode(true);
        control.addEventListener('click', (event) => {
            const option = event.target.closest('[data-view]');
            if (option) setView(option.dataset.view, true);
        });
        const before = group[0].previousElementSibling;
        const heading = before?.matches('.frame') && before.querySelector('h1, h2') ? before : null;
        heading?.append(control);
        switches.push({ control, heading, shelfContent: content, rollContent });
    }
    // After the cards, so the heading's "frame + .kovpack-product" styling still applies.
    group.at(-1).after(shelfSection);

    for (const item of items) {
        item.querySelector('.kovpack-shelf__toggle').addEventListener('click', () => activate(shelf, item));
    }
    // The design opens the middle product first.
    activate(shelf, items[Math.floor((items.length - 1) / 2)]);
    shelves.push(shelf);
}

stacked.addEventListener('change', () => shelves.forEach(renderInert));

const fromUrl = URL_VIEWS[window.location.hash.slice(1).toLowerCase()];
setView(fromUrl ?? readStored() ?? 'rolls', Boolean(fromUrl));

})();
