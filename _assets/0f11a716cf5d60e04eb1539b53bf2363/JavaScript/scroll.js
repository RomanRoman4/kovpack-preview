(() => {
"use strict";
// Sticky header and back-to-top button (owner request 2026-11-04). Home page
// only switches the bar: inner pages keep one sticky slim bar that fades from
// dark to light (.is-scrolled) once the page scrolls (2026-11-05).
//
// Once the full header has scrolled out of view, it returns as a compact bar
// fixed to the top (.is-stuck) and stays until the visitor is back at the top
// of the page. Pages whose header sits in the document flow get a spacer of the
// same height, so nothing below jumps. The back-to-top button appears after
// roughly one screen and glides back with an ease-in-out curve: it speeds up,
// then settles softly. Reduced motion jumps straight to the top.

const header = document.querySelector('.header');
const toTop = document.querySelector('[data-to-top]');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

let spacer = null;
let headerHeight = 0;
let inFlow = false;

const measure = () => {
    if (!header || header.classList.contains('is-stuck')) return;
    headerHeight = header.offsetHeight;
    inFlow = !['absolute', 'fixed'].includes(getComputedStyle(header).position);
};

const setStuck = (stuck) => {
    if (!header || header.classList.contains('is-stuck') === stuck) return;
    if (stuck) measure();
    if (inFlow) {
        if (!spacer) {
            spacer = document.createElement('div');
            spacer.className = 'kovpack-header-spacer';
            spacer.setAttribute('aria-hidden', 'true');
            // Before the header: Camino styles the header by its next sibling (the hero).
            header.before(spacer);
        }
        spacer.style.height = stuck ? `${headerHeight}px` : '0px';
    }
    header.classList.toggle('is-stuck', stuck);
};

// Back at the top the bar dissolves first (.is-leaving), then the full header
// fades in at its place (.is-returning), so nothing switches abruptly.
const release = () => {
    if (!header?.classList.contains('is-stuck') || header.classList.contains('is-leaving')) return;
    if (reducedMotion.matches) {
        setStuck(false);
        return;
    }
    header.classList.add('is-leaving');
};
const cancelRelease = () => header?.classList.remove('is-leaving');
header?.addEventListener('animationend', (event) => {
    if (event.target !== header) return;
    if (event.animationName === 'kovpack-header-out' && header.classList.contains('is-leaving')) {
        header.classList.remove('is-leaving');
        setStuck(false);
        header.classList.add('is-returning');
    } else if (event.animationName === 'kovpack-header-return') {
        header.classList.remove('is-returning');
    }
});

// Inner pages (no full-height hero) have a slim bar that site.css keeps
// sticky at the top; it never switches, so only the home page header does.
const switching = Boolean(header?.matches(':has(+ .hero:not(.hero--text-only, .hero--small))'));

const update = () => {
    const y = window.scrollY;
    // Stick once the full header is gone; release only back at the very top.
    if (!switching) {
        // Inner pages: the bar stays in place and only fades from dark to light.
        header?.classList.toggle('is-scrolled', y > 2);
    } else if (y > headerHeight) {
        cancelRelease();
        header?.classList.remove('is-returning');
        setStuck(true);
    } else if (y <= 2) release();
    if (toTop) toTop.classList.toggle('is-visible', y > window.innerHeight * 0.8);
};

let ticking = false;
const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
        ticking = false;
        update();
    });
};

// Back to top: ease in and out over a duration that grows with the distance.
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
let glide = 0;
const stopGlide = () => {
    cancelAnimationFrame(glide);
    glide = 0;
};
const scrollToTop = () => {
    stopGlide();
    const start = window.scrollY;
    const focusTop = () => {
        // Keyboard users continue at the top of the page instead of the bottom.
        if (document.activeElement === toTop) header?.querySelector('a, button')?.focus({ preventScroll: true });
    };
    if (reducedMotion.matches || start <= 0) {
        window.scrollTo({ top: 0, behavior: 'instant' });
        focusTop();
        return;
    }
    const duration = Math.min(1100, Math.max(520, start * 0.35));
    const began = performance.now();
    const step = (now) => {
        const progress = Math.min(1, (now - began) / duration);
        window.scrollTo({ top: Math.round(start * (1 - easeInOutCubic(progress))), behavior: 'instant' });
        if (progress < 1) glide = requestAnimationFrame(step);
        else {
            glide = 0;
            focusTop();
        }
    };
    glide = requestAnimationFrame(step);
};

if (toTop) {
    toTop.hidden = false;
    toTop.addEventListener('click', () => {
        // Replay the arrow's launch on every press.
        toTop.classList.remove('is-launching');
        void toTop.offsetWidth;
        toTop.classList.add('is-launching');
        scrollToTop();
    });
    toTop.addEventListener('animationend', () => toTop.classList.remove('is-launching'));
    // The visitor takes over as soon as they scroll themselves.
    for (const type of ['wheel', 'touchstart', 'keydown']) addEventListener(type, () => glide && stopGlide(), { passive: true });
}

measure();
update();
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => {
    measure();
    update();
});

})();
