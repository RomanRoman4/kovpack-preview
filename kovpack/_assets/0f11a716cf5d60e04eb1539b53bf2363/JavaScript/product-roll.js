(() => {
"use strict";
// Product roll cards (approved roll-reveal concept). With a mouse, hovering the
// card unrolls the paper sheet; a click or tap on the roll pins it open and a
// second one rolls it up. Escape closes every card. Each card keeps its own
// state. Without JavaScript, CSS :hover/:focus-within still unrolls the sheet.
const cards = [];
const phone = window.matchMedia('(max-width: 900px)');

for (const root of document.querySelectorAll('[data-roll] .kovpack-roll')) {
    const reel = root.querySelector('[data-roll-toggle]');
    const sheet = root.querySelector('.kovpack-roll__sheet');
    if (!reel || !sheet) continue;
    const card = { root, reel, sheet, pinned: false, hovering: false, focusWithin: false, suppressed: false };
    card.render = () => {
        if (phone.matches) {
            // Phones: the scroll unrolls the sheet (below); it is never a toggle.
            root.classList.remove('is-open');
            sheet.inert = false;
            reel.tabIndex = -1;
            reel.setAttribute('aria-hidden', 'true');
            reel.removeAttribute('aria-expanded');
            return;
        }
        reel.removeAttribute('tabindex');
        reel.removeAttribute('aria-hidden');
        const open = !card.suppressed && (card.pinned || card.hovering || card.focusWithin);
        root.classList.toggle('is-open', open);
        sheet.inert = !open;
        reel.setAttribute('aria-expanded', String(open));
        reel.setAttribute('aria-label', open ? reel.dataset.labelClose : reel.dataset.labelOpen);
    };
    const toggle = () => {
        if (card.pinned) {
            card.pinned = false;
            card.suppressed = true;
        } else {
            // Only one card stays pinned, so a phone shows one open sheet at a time.
            for (const other of cards) {
                if (other === card || !other.pinned) continue;
                other.pinned = false;
                other.render();
            }
            card.pinned = true;
            card.suppressed = false;
        }
        card.render();
    };
    root.addEventListener('pointerenter', (event) => {
        if (event.pointerType !== 'mouse') return;
        card.hovering = true;
        card.suppressed = false;
        card.render();
    });
    root.addEventListener('pointerleave', () => {
        card.hovering = false;
        card.suppressed = false;
        card.render();
    });
    root.addEventListener('focusin', () => {
        card.focusWithin = true;
        card.render();
    });
    root.addEventListener('focusout', () => {
        setTimeout(() => {
            card.focusWithin = root.contains(document.activeElement);
            card.render();
        }, 0);
    });
    reel.addEventListener('click', toggle);
    // The product name and teaser beside the closed roll are a larger target.
    root.querySelector('.kovpack-roll__label')?.addEventListener('click', toggle);
    root.classList.add('is-ready');
    cards.push(card);
    card.render();
}

phone.addEventListener('change', () => cards.forEach((card) => card.render()));

// Phones (owner, 2026-11-12): the scroll unrolls each card. --unroll on the
// product record runs from 0 to 1 while the sheet comes up the screen: its
// free edge stays at about 86% of the screen height until the sheet is fully
// open. Only cards near the screen are measured, once per frame.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollCards = cards.map((card) => ({ section: card.root.closest('.kovpack-product') ?? card.root, sheet: card.sheet, value: -1 }));
if (scrollCards.length && 'IntersectionObserver' in window) {
    const near = new Set();
    let frame = 0;
    const measure = () => {
        frame = 0;
        const live = phone.matches && !reducedMotion.matches;
        const edge = window.innerHeight * 0.86;
        for (const card of live ? near : scrollCards) {
            let value = 1;
            if (live) {
                const box = card.sheet.getBoundingClientRect();
                value = box.height ? Math.min(1, Math.max(0, (edge - box.top) / box.height)) : 1;
                value = Math.round(value * 1000) / 1000;
            }
            if (value === card.value) continue;
            card.value = value;
            card.section.style.setProperty('--unroll', String(value));
        }
    };
    const request = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const watcher = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            const card = scrollCards.find((item) => item.section === entry.target);
            if (!card) continue;
            if (entry.isIntersecting) near.add(card);
            else {
                near.delete(card);
                // Leaving above: fully open; leaving below: rolled up again.
                const value = entry.boundingClientRect.top < 0 ? 1 : 0;
                if (phone.matches && !reducedMotion.matches && card.value !== value) {
                    card.value = value;
                    card.section.style.setProperty('--unroll', String(value));
                }
            }
        }
        request();
    }, { rootMargin: '10% 0px 10% 0px' });
    for (const card of scrollCards) watcher.observe(card.section);
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', request);
    phone.addEventListener('change', () => { for (const card of scrollCards) card.value = -1; measure(); });
    reducedMotion.addEventListener('change', () => { for (const card of scrollCards) card.value = -1; measure(); });
    // Printing shows every sheet open.
    addEventListener('beforeprint', () => scrollCards.forEach((card) => card.section.style.setProperty('--unroll', '1')));
    measure();
}

document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || phone.matches) return;
    for (const card of cards) {
        const hadFocus = card.sheet.contains(document.activeElement);
        Object.assign(card, { pinned: false, hovering: false, focusWithin: false, suppressed: true });
        if (hadFocus) card.reel.focus();
        card.render();
    }
});

})();
