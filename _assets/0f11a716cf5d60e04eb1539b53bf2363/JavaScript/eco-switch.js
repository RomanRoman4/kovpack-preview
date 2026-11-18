// Seal preview preferences shared by the product cards and detail pages.
(() => {
    const root = document.documentElement;
    const lang = root.lang === 'de' ? 'de' : 'en';

    function makePreference(name, label, options, apply) {
        const key = 'kovpack-eco-' + name;
        const buttons = [];
        let stored;
        try { stored = window.localStorage.getItem(key); } catch { /* private mode */ }
        let current = Object.hasOwn(options, stored) ? stored : Object.keys(options)[0];
        apply(current);

        return (onSheet = false) => {
            const control = document.createElement('div');
            control.className = 'kovpack-eco-switch';
            if (onSheet) control.classList.add('kovpack-eco-switch--sheet');
            control.setAttribute('role', 'group');
            control.setAttribute('aria-label', label[lang]);
            for (const [value, text] of Object.entries(options)) {
                const button = document.createElement('button');
                button.type = 'button';
                button.dataset[name] = value;
                button.textContent = text[lang];
                button.setAttribute('aria-pressed', String(value === current));
                button.addEventListener('click', () => {
                    if (value === current) return;
                    current = value;
                    apply(current);
                    for (const option of buttons) {
                        option.setAttribute('aria-pressed', String(option.dataset[name] === current));
                    }
                    try { window.localStorage.setItem(key, current); } catch { /* private mode */ }
                });
                buttons.push(button);
                control.append(button);
            }
            return control;
        };
    }

    const toneSwitch = makePreference('tone', { de: 'Farbe des Siegels', en: 'Seal colour' }, {
        brand: { de: 'Türkis', en: 'Teal' },
        green: { de: 'Grün', en: 'Green' }
    }, (tone) => { root.dataset.ecoTone = tone; });
    for (const seal of document.querySelectorAll('.kovpack-eco--pdp')) seal.after(toneSwitch());

    const sheets = [...document.querySelectorAll('.kovpack-roll__seal')].map((seal) => ({
        seal,
        footer: seal.closest('.kovpack-roll__footer'),
        content: seal.closest('.kovpack-roll__sheet-content'),
        sheet: seal.closest('.kovpack-roll__sheet')
    })).filter(({ footer, content, sheet }) => footer && content && sheet);
    const positionSwitch = makePreference('position', { de: 'Position des Siegels', en: 'Seal position' }, {
        bottom: { de: 'Unten', en: 'Bottom' },
        top: { de: 'Oben rechts', en: 'Top right' }
    }, (position) => {
        for (const { seal, footer, content } of sheets) {
            if (position === 'top') content.prepend(seal);
            else footer.append(seal);
        }
    });
    for (const { sheet } of sheets) {
        const controls = document.createElement('div');
        controls.className = 'kovpack-roll__seal-controls';
        controls.append(toneSwitch(true), positionSwitch(true));
        sheet.append(controls);
    }
})();
