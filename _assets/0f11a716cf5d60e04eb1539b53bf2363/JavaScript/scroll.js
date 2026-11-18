(() => {
"use strict";
// The wide homepage swaps its full header for a compact fixed bar. The compact
// navigation uses one bar and hides or reveals it with the scroll direction.

const header = document.querySelector('.header');
const toTop = document.querySelector('[data-to-top]');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const wideHeader = matchMedia('(min-width: 1280px) and (hover: hover)');

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

const switching = Boolean(header?.matches(':has(+ .hero:not(.hero--text-only, .hero--small))'));
const compactLock = '.is-menu-open, :has(.header__menu--open, :focus-visible)';
let directionAnchor = Math.max(0, window.scrollY);
let compactHideReadyAt = 0;
let idleTimer = 0;

const updateCompactHeader = (y) => {
    clearTimeout(idleTimer);
    if (!header) return;
    if (y <= headerHeight || header.matches(compactLock)) {
        header.classList.remove('is-scroll-hidden');
        directionAnchor = y;
        return;
    }

    // Measure from the last high or low point so tiny reversals do not flicker.
    const hidden = header.classList.contains('is-scroll-hidden');
    directionAnchor = hidden ? Math.max(directionAnchor, y) : Math.min(directionAnchor, y);
    const shouldToggle = hidden ? directionAnchor - y >= 10 :
        y - directionAnchor >= 18 && performance.now() >= compactHideReadyAt;
    if (shouldToggle) {
        header.classList.toggle('is-scroll-hidden', !hidden);
        directionAnchor = y;
    }
    if (!header.classList.contains('is-scroll-hidden')) {
        idleTimer = setTimeout(() => {
            if (window.scrollY <= headerHeight || header.matches(compactLock)) return;
            directionAnchor = y;
            header.classList.add('is-scroll-hidden');
        }, 1400);
    }
};

const update = () => {
    const y = window.scrollY;
    const scrolled = y > 2;
    if (!wideHeader.matches && switching && scrolled && !header.classList.contains('is-scrolled')) {
        // Let the hero's glass transition finish before the first hide.
        compactHideReadyAt = performance.now() + (reducedMotion.matches ? 0 : 400);
    }
    header?.classList.toggle('is-scrolled', scrolled && (!switching || !wideHeader.matches));

    if (!wideHeader.matches) {
        // Safari's overscroll can report positions beyond either page edge.
        const page = document.scrollingElement;
        updateCompactHeader(Math.max(0, Math.min(y, page.scrollHeight - page.clientHeight)));
    } else if (switching) {
        if (y > headerHeight) {
            cancelRelease();
            header.classList.remove('is-returning');
            setStuck(true);
        } else if (y <= 2) release();
    }
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

// Arriving with a section anchor (menu "Kontakt" -> home page #kontakt): the
// home page builds its shelf and slideshow after the browser's own jump, so
// land on the section again once the page has loaded. Only a fresh visit,
// never when the browser restores an earlier scroll position.
const landOnAnchor = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id && document.getElementById(id);
    const restored = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
    if (!target || restored) return;
    target.scrollIntoView({ behavior: 'instant', block: 'start' });
};
if (document.readyState === 'complete') landOnAnchor();
else addEventListener('load', () => setTimeout(landOnAnchor, 0), { once: true });

measure();
update();
addEventListener('scroll', onScroll, { passive: true });
wideHeader.addEventListener('change', () => {
    clearTimeout(idleTimer);
    directionAnchor = Math.max(0, window.scrollY);
    header?.classList.remove('is-scroll-hidden', 'is-leaving', 'is-returning');
    if (!wideHeader.matches) setStuck(false);
    measure();
    update();
});
addEventListener('resize', () => {
    measure();
    update();
});

})();
