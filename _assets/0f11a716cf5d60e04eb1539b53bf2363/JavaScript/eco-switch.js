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

    for (const seal of document.querySelectorAll('.kovpack-eco--pdp')) {
        const control = document.createElement('div');
        control.className = 'kovpack-eco-switch';
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
        seal.after(control);
    }
    setTone(root.dataset.ecoTone, false);
})();
