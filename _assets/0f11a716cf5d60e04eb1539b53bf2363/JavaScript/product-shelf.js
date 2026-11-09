(() => {
"use strict";
// "Regal" (shelf) view of the product cards and the Rollen/Regal switch.
// Each product record ships its shelf item and the switch in inert <template>
// elements; consecutive product records become one shelf placed before them.
// A product block can fix its view with data-product-view="rolls" or "shelf"
// on its first record (an editor setting): then that view is shown and there
// is no switch. Otherwise the visitor's choice is kept; #regal or #rollen at
// the end of the URL selects it directly (handy for sharing the design
// preview). A fragment, not a query parameter, because TYPO3 answers unknown
// parameters without cHash with 404.
const STORAGE_KEY = 'kovpack-products-view';
const NAME_STORAGE_KEY = 'kovpack-product-name-style';
const VIEWS = ['rolls', 'shelf'];
const URL_VIEWS = { rollen: 'rolls', rolls: 'rolls', regal: 'shelf', shelf: 'shelf' };
const NAME_STYLES = ['lead-upper', 'upper', 'title'];
const PRODUCT_NAMES = {
    protect: { 'lead-upper': 'PROTECT Paper', upper: 'PROTECT PAPER', title: 'Protect Paper' },
    packing: { 'lead-upper': 'PACKING Paper', upper: 'PACKING PAPER', title: 'Packing Paper' },
    fill: { 'lead-upper': 'FILL Paper', upper: 'FILL PAPER', title: 'Fill Paper' }
};
const NAME_TARGETS = '.kovpack-roll__title, .kovpack-roll__name, .kovpack-shelf__label, .kovpack-shelf__name, .kovpack-pdp__title, .kovpack-pdp__crumbs [aria-current="page"], .kovpack-offer__product';
const stacked = window.matchMedia('(max-width: 1023px)');
const root = document.documentElement;
const switches = [];
const nameSwitches = [];
const shelves = [];

const readStored = () => {
    try { return window.localStorage.getItem(STORAGE_KEY); } catch { return null; }
};
const store = (view) => {
    try { window.localStorage.setItem(STORAGE_KEY, view); } catch { /* private mode: keep it for this page only */ }
};
const readNameStyle = () => {
    try { return window.localStorage.getItem(NAME_STORAGE_KEY); } catch { return null; }
};
const storeNameStyle = (style) => {
    try { window.localStorage.setItem(NAME_STORAGE_KEY, style); } catch { /* private mode: keep it for this page only */ }
};

const writeProductName = (container, name) => {
    for (const target of container.querySelectorAll(NAME_TARGETS)) target.textContent = name;
};
const setNameStyle = (style, remember) => {
    if (!NAME_STYLES.includes(style)) style = 'lead-upper';
    root.dataset.productNameStyle = style;
    for (const container of document.querySelectorAll('[data-product-name-key]')) {
        const name = PRODUCT_NAMES[container.dataset.productNameKey]?.[style];
        if (!name) continue;
        writeProductName(container, name);
        for (const template of container.querySelectorAll('template')) writeProductName(template.content, name);
    }
    for (const control of nameSwitches) {
        for (const option of control.querySelectorAll('[data-name-style]')) option.setAttribute('aria-pressed', String(option.dataset.nameStyle === style));
    }
    if (remember) storeNameStyle(style);
    splitTitles();
};
// Product titles carry the product word and "Paper" in two spans, so the
// "wide" title type (owner, 2026-11-09) can set them as a heavy and a light
// line. The plain type shows the same text on one line as before.
const TITLE_TARGETS = '.kovpack-pdp__title, .kovpack-roll__title';
const splitTitles = () => {
    for (const title of document.querySelectorAll(TITLE_TARGETS)) {
        const text = title.textContent.trim().replace(/s+/g, ' ');
        const cut = text.lastIndexOf(' ');
        if (cut < 1) continue;
        const lead = document.createElement('span');
        lead.className = 'kovpack-title__lead';
        lead.textContent = text.slice(0, cut);
        const rest = document.createElement('span');
        rest.className = 'kovpack-title__rest';
        rest.textContent = text.slice(cut + 1);
        title.replaceChildren(lead, ' ', rest);
    }
};
const createNameSwitch = () => {
    const control = document.createElement('div');
    control.className = 'kovpack-name-switch';
    control.setAttribute('role', 'group');
    control.setAttribute('aria-label', root.lang === 'de' ? 'Schreibweise der Produktnamen' : 'Product name capitalization');
    for (const style of NAME_STYLES) {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'kovpack-name-switch__option';
        option.dataset.nameStyle = style;
        option.textContent = PRODUCT_NAMES.protect[style];
        control.append(option);
    }
    control.addEventListener('click', (event) => {
        const option = event.target.closest('[data-name-style]');
        if (option) setNameStyle(option.dataset.nameStyle, true);
    });
    nameSwitches.push(control);
    return control;
};

// Paper look of the unrolled sheet (design preview options, owner 2026-11-05):
// the surface and the cut end, set on <html> and kept for the visitor.
const LOOKS = {
    paperStyle: {
        storageKey: 'kovpack-paper-style',
        label: { de: 'Papier', en: 'Paper' },
        options: { calm: { de: 'Glatt', en: 'Flat' }, waves: { de: 'Leicht wellig', en: 'Slight waves' }, curl: { de: 'Gewölbt', en: 'Curled' } }
    },
    paperCut: {
        storageKey: 'kovpack-paper-cut',
        label: { de: 'Abriss am Ende', en: 'Cut end' },
        options: { serrated: { de: 'Zackenschnitt', en: 'Serrated' }, torn: { de: 'Gerissen', en: 'Torn' }, clean: { de: 'Glatter Schnitt', en: 'Clean cut' } }
    },
    // Display face of names and section headings, on every page (scroll.js
    // restores the stored choice on pages without products).
    displayFont: {
        storageKey: 'kovpack-display-font',
        label: { de: 'Schrift (Namen, Überschriften)', en: 'Font (names, headings)' },
        options: { archivo: { de: 'Archivo', en: 'Archivo' }, shoulders: { de: 'Big Shoulders', en: 'Big Shoulders' }, saira: { de: 'Saira', en: 'Saira' }, barlow: { de: 'Barlow (bisher)', en: 'Barlow (current)' } }
    },
    // Product titles on the product pages, the overview and the roll cards:
    // the display face as set above, or a wide Archivo pair (heavy product
    // word over a light "Paper"), owner 2026-11-09.
    titleType: {
        storageKey: 'kovpack-title-type',
        label: { de: 'Produkttitel', en: 'Product title' },
        options: { current: { de: 'Aktuell', en: 'Current' }, wide: { de: 'Breit, zweizeilig', en: 'Wide, two lines' } }
    },
    // Shelf view only: the product name below or above the standing roll.
    shelfLabel: {
        storageKey: 'kovpack-shelf-label',
        label: { de: 'Name im Regal', en: 'Name on the shelf' },
        options: { below: { de: 'Name unten', en: 'Name below' }, above: { de: 'Name oben', en: 'Name above' } }
    }
};
const lookSwitches = [];
const lang = root.lang === 'de' ? 'de' : 'en';
const setLook = (name, value, remember) => {
    const look = LOOKS[name];
    if (!(value in look.options)) value = Object.keys(look.options)[0];
    root.dataset[name] = value;
    for (const control of lookSwitches) {
        for (const option of control.querySelectorAll(`[data-look="${name}"]`)) option.setAttribute('aria-pressed', String(option.dataset.value === value));
    }
    if (remember) {
        try { window.localStorage.setItem(look.storageKey, value); } catch { /* private mode: keep it for this page only */ }
    }
};
const createLookSwitch = (name) => {
    const look = LOOKS[name];
    const control = document.createElement('div');
    control.className = 'kovpack-name-switch kovpack-look-switch';
    control.setAttribute('role', 'group');
    control.setAttribute('aria-label', look.label[lang]);
    control.title = look.label[lang];
    for (const [value, text] of Object.entries(look.options)) {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'kovpack-name-switch__option';
        option.dataset.look = name;
        option.dataset.value = value;
        option.textContent = text[lang];
        option.setAttribute('aria-pressed', String(root.dataset[name] === value));
        control.append(option);
    }
    control.addEventListener('click', (event) => {
        const option = event.target.closest('[data-look]');
        if (option) setLook(name, option.dataset.value, true);
    });
    lookSwitches.push(control);
    return control;
};
for (const name of Object.keys(LOOKS)) {
    let stored = null;
    try { stored = window.localStorage.getItem(LOOKS[name].storageKey); } catch { /* private mode */ }
    setLook(name, stored, false);
}

// Each preview switch with a small caption above it, saying what it changes.
const captioned = (text, control) => {
    const wrap = document.createElement('div');
    wrap.className = 'kovpack-control';
    const caption = document.createElement('span');
    caption.className = 'kovpack-control__caption';
    caption.setAttribute('aria-hidden', 'true');
    caption.textContent = text;
    wrap.append(caption, control);
    return wrap;
};
const lookControl = (name) => captioned(LOOKS[name].label[lang], createLookSwitch(name));

// Hides whichever view of a block is not shown.
const showView = (block, view) => {
    for (const section of block.sections) section.toggleAttribute('data-view-off', view === 'shelf');
    block.shelfSection?.toggleAttribute('data-view-off', view !== 'shelf');
};

// The controls join the section heading ("Produkte") when one stands right
// before the products; otherwise they sit at the top of whichever view is
// shown. They never get a component of their own, which would add Camino's
// full section spacing around them.
const placeControls = (group, view) => {
    if (!group.heading) (view === 'shelf' ? group.shelfContent : group.rollContent)?.prepend(group.controls);
};

const switchable = [];
const setView = (view, remember) => {
    if (!VIEWS.includes(view)) view = 'rolls';
    for (const block of switchable) showView(block, view);
    for (const group of switches) {
        const hadFocus = group.controls.contains(document.activeElement) ? document.activeElement : null;
        placeControls(group, view);
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

// The product-name control (and, for a switchable block, the view switch).
const addControls = (group, view, shelfContent) => {
    const rollContent = group[0].querySelector('.component__content');
    const switchTemplate = view ? null : group[0].querySelector('template[data-shelf-switch]');
    const controls = document.createElement('div');
    controls.className = 'kovpack-product-controls';
    controls.append(
        captioned(lang === 'de' ? 'Schreibweise' : 'Name style', createNameSwitch()),
        lookControl('displayFont'),
        lookControl('titleType'),
        lookControl('paperStyle'),
        lookControl('paperCut')
    );
    if (view !== 'rolls') controls.append(lookControl('shelfLabel'));
    const before = group[0].previousElementSibling;
    const heading = before?.matches('.frame') && before.querySelector('h1, h2') ? before : null;
    const placement = { controls, heading, shelfContent, rollContent };
    if (switchTemplate) {
        const control = switchTemplate.content.firstElementChild.cloneNode(true);
        control.addEventListener('click', (event) => {
            const option = event.target.closest('[data-view]');
            if (option) setView(option.dataset.view, true);
        });
        controls.append(control);
        switches.push({ ...placement, control });
    }
    if (heading) heading.append(controls);
    else if (view) placeControls(placement, view);
};

for (const group of groups) {
    const fixed = VIEWS.includes(group[0].dataset.productView) ? group[0].dataset.productView : null;
    const block = { sections: group, shelfSection: null };
    // A block fixed to the roll cards needs no shelf.
    if (fixed === 'rolls') {
        showView(block, 'rolls');
        addControls(group, 'rolls', null);
        continue;
    }
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
        if (section.dataset.productNameKey) item.dataset.productNameKey = section.dataset.productNameKey;
        items.push(item);
        row.append(item);
    }
    if (!items.length) continue;
    const shelf = { items };
    block.shelfSection = shelfSection;

    if (fixed) showView(block, fixed);
    else switchable.push(block);
    addControls(group, fixed, content);
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

for (const crumbs of document.querySelectorAll('.kovpack-pdp__crumbs')) {
    const bar = document.createElement('div');
    bar.className = 'kovpack-pdp__topbar';
    crumbs.before(bar);
    const controls = document.createElement('div');
    controls.className = 'kovpack-product-controls kovpack-pdp__controls';
    controls.append(lookControl('titleType'));
    bar.append(crumbs, controls);
}

const fromUrl = URL_VIEWS[window.location.hash.slice(1).toLowerCase()];
setNameStyle(readNameStyle() ?? 'lead-upper', false);
setView(fromUrl ?? readStored() ?? 'rolls', Boolean(fromUrl));

})();
