// Recycled seal colour: a design preview switch (owner, 2026-11-17).
// Brand teal or the earlier grass green, kept per visitor, so the seals on
// the product rolls follow the choice made on a product page.
(() => {
    const root = document.documentElement;
    const KEY = 'kovpack-eco-tone';
    const TONES = { brand: { de: 'Türkis', en: 'Teal' }, green: { de: 'Grün', en: 'Green' } };
    const lang = root.lang === 'de' ? 'de' : 'en';
    const switches = [];

    const setTone = (tone, remember) => {
        if (!(tone in TONES)) tone = 'brand';
        root.dataset.ecoTone = tone;
        for (const option of switches.flatMap((s) => [...s.children])) {
            option.setAttribute('aria-pressed', String(option.dataset.tone === tone));
        }
        if (remember) {
            try { window.localStorage.setItem(KEY, tone); } catch { /* private mode: this page only */ }
        }
    };

    let stored = null;
    try { stored = window.localStorage.getItem(KEY); } catch { /* private mode */ }
    setTone(stored, false);

    const makeSwitch = (extraClass) => {
        const control = document.createElement('div');
        control.className = 'kovpack-eco-switch' + (extraClass ? ' ' + extraClass : '');
        control.setAttribute('role', 'group');
        control.setAttribute('aria-label', lang === 'de' ? 'Farbe des Siegels' : 'Seal colour');
        for (const [tone, text] of Object.entries(TONES)) {
            const option = document.createElement('button');
            option.type = 'button';
            option.dataset.tone = tone;
            option.textContent = text[lang];
            control.append(option);
        }
        control.addEventListener('click', (event) => {
            const option = event.target.closest('[data-tone]');
            if (option) setTone(option.dataset.tone, true);
        });
        switches.push(control);
        return control;
    };

    // Product pages: floated under the seal beside the title.
    for (const seal of document.querySelectorAll('.kovpack-eco--pdp')) seal.after(makeSwitch());

    // Product rolls: placed beside the seal on the unrolled sheet, shown with it.
    const sheetPairs = [...document.querySelectorAll('.kovpack-eco--sheet')].map((seal) => {
        const control = makeSwitch('kovpack-eco-switch--sheet');
        control.addEventListener('click', (event) => event.stopPropagation());
        seal.after(control);
        return [seal, control];
    });
    const placeSheetSwitches = () => {
        for (const [seal, control] of sheetPairs) {
            // An SVG has no offsetTop: measure both boxes against the switch's
            // positioned parent instead (the seal is scaled while hidden).
            const shown = seal.getClientRects().length > 0;
            control.hidden = !shown;
            if (!shown || !control.offsetParent) continue;
            const parent = control.offsetParent.getBoundingClientRect();
            const box = seal.getBoundingClientRect();
            const scale = parseFloat(getComputedStyle(seal).scale) || 1;
            const centreX = box.left + box.width / 2 - parent.left;
            const centreY = box.top + box.height / 2 - parent.top;
            // To the left of the seal, on its middle: below it there is no room
            // when the seal sits in the lower corner of the sheet.
            control.style.top = Math.round(centreY - control.offsetHeight / 2) + 'px';
            control.style.left = Math.round(centreX - box.width / scale / 2 - 12 - control.offsetWidth) + 'px';
        }
    };
    if (sheetPairs.length) {
        addEventListener('resize', placeSheetSwitches);
        document.fonts?.ready.then(placeSheetSwitches);
        for (const [seal] of sheetPairs) seal.closest('.kovpack-roll')?.addEventListener('transitionend', placeSheetSwitches);
        placeSheetSwitches();
    }
    setTone(root.dataset.ecoTone, false);
})();
