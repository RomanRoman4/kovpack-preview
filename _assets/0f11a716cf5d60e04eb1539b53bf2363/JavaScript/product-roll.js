(() => {
"use strict";
// Product roll cards (approved roll-reveal concept). With a mouse, hovering the
// card unrolls the paper sheet; a click or tap on the roll pins it open and a
// second one rolls it up. Escape closes every card. Each card keeps its own
// state. Without JavaScript, CSS :hover/:focus-within still unrolls the sheet.
const cards = [];

for (const root of document.querySelectorAll('[data-roll] .kovpack-roll')) {
    const reel = root.querySelector('[data-roll-toggle]');
    const sheet = root.querySelector('.kovpack-roll__sheet');
    if (!reel || !sheet) continue;
    const card = { root, reel, sheet, pinned: false, hovering: false, focusWithin: false, suppressed: false };
    card.render = () => {
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

document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    for (const card of cards) {
        const hadFocus = card.sheet.contains(document.activeElement);
        Object.assign(card, { pinned: false, hovering: false, focusWithin: false, suppressed: true });
        if (hadFocus) card.reel.focus();
        card.render();
    }
});

})();
