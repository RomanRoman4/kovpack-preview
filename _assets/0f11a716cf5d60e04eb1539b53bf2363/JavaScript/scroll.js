(() => {
"use strict";
// The wide homepage swaps its full header for a compact fixed bar (.is-docked).
// While the hero photo is still under it the bar stays clear glass; once the
// photo has passed it fades into the light bar (.is-stuck) and from then on,
// like the compact navigation, hides on the way down or after a pause and
// comes back when scrolling up (owner, 2026-11-20).

const header = document.querySelector('.header');
const toTop = document.querySelector('[data-to-top]');
const footer = document.querySelector('.component--page-footer');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const wideHeader = matchMedia('(min-width: 1280px) and (hover: hover)');

let spacer = null;
let headerHeight = 0;
let inFlow = false;

const measure = () => {
    if (!header || header.classList.contains('is-docked')) return;
    headerHeight = header.offsetHeight;
    inFlow = !['absolute', 'fixed'].includes(getComputedStyle(header).position);
};

const setStuck = (stuck) => {
    if (!header || header.classList.contains('is-docked') === stuck) return;
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
    header.classList.toggle('is-docked', stuck);
    if (!stuck) header.classList.remove('is-stuck', 'is-scroll-hidden');
};

// Back at the top the bar turns into the full header in one move (owner,
// 2026-11-23: fading the bar out and the header in made the menu jump 35 px
// down). The logo and the menu glide and grow from where they sat in the bar
// to their places in the full header (measured before and after, FLIP).
const glideParts = () => [header.querySelector('.header__logo'), header.querySelector('.header__nav')].filter(Boolean);
const release = () => {
    if (!header?.classList.contains('is-docked') || header.classList.contains('is-leaving')) return;
    header.classList.remove('is-stuck', 'is-scroll-hidden');
    if (reducedMotion.matches || !wideHeader.matches) {
        setStuck(false);
        return;
    }
    const parts = glideParts();
    const from = parts.map((el) => el.getBoundingClientRect());
    setStuck(false);
    parts.forEach((el, i) => {
        const a = from[i];
        const b = el.getBoundingClientRect();
        if (!b.width || !b.height) return;
        const dx = a.left - b.left;
        const dy = a.top - b.top;
        const sx = a.width / b.width;
        const sy = a.height / b.height;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < .01 && Math.abs(sy - 1) < .01) return;
        el.animate([
            { transformOrigin: '0 0', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
            { transformOrigin: '0 0', transform: 'none' },
        ], { duration: 520, easing: 'cubic-bezier(.32, .72, 0, 1)', fill: 'backwards' });
    });
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
const lockBase = '.is-menu-open, :has(.header__menu--open, .header__language-dropdown--open, :focus-visible)';
// On the wide bar the pointer on the menu or an open submenu keeps it in view.
let compactLock = lockBase;
const setLock = () => { compactLock = wideHeader.matches ? `${lockBase}, .is-pointer-in` : lockBase; };
setLock();
let directionAnchor = Math.max(0, window.scrollY);
let compactHideReadyAt = 0;
let idleTimer = 0;

const hero = switching ? header.nextElementSibling : null;

// Teal glass bar switch (owner, 2026-11-20): on the inner pages the wide bar
// can stay teal frosted glass while scrolling, so the page runs blurred under
// it, instead of turning into the light bar. Kept per browser.
const root = document.documentElement;
const tealBarKey = "kovpack-bar-look";
let tealBarSaved = null;
try { tealBarSaved = localStorage.getItem(tealBarKey); } catch (e) { /* private mode */ }
root.classList.toggle("kovpack-bar-teal", tealBarSaved !== "light");
const keepTeal = () => !switching && wideHeader.matches && root.classList.contains("kovpack-bar-teal");

const updateCompactHeader = (y, floor = headerHeight) => {
    clearTimeout(idleTimer);
    if (!header) return;
    if (y <= floor || header.matches(compactLock)) {
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
            if (window.scrollY <= floor || header.matches(compactLock)) return;
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
    header?.classList.toggle('is-scrolled', scrolled && (!switching || !wideHeader.matches) && !keepTeal());

    if (!wideHeader.matches) {
        // Safari's overscroll can report positions beyond either page edge.
        const page = document.scrollingElement;
        updateCompactHeader(Math.max(0, Math.min(y, page.scrollHeight - page.clientHeight)));
    } else if (keepTeal()) {
        // The teal glass bar of the inner pages hides on the way down and
        // after a pause, and comes back on the way up, as on the home page.
        const page = document.scrollingElement;
        updateCompactHeader(Math.max(0, Math.min(y, page.scrollHeight - page.clientHeight)));
    } else if (!switching) {
        clearTimeout(idleTimer);
        header?.classList.remove("is-scroll-hidden");
    } else if (switching) {
        if (y > headerHeight) {
            cancelRelease();
            header.classList.remove('is-returning');
            setStuck(true);
        } else if (y <= 2) release();
        if (header.classList.contains('is-docked') && !header.classList.contains('is-leaving')) {
            // The light bar only once the photo's lower edge has passed under it.
            const bar = header.offsetHeight;
            const heroEnd = hero ? hero.getBoundingClientRect().bottom + y : 0;
            const floor = Math.max(headerHeight, heroEnd - bar);
            const light = y >= floor;
            if (light && !header.classList.contains('is-stuck')) {
                // Let the glass fade to the light bar before the first hide.
                compactHideReadyAt = performance.now() + (reducedMotion.matches ? 0 : 600);
            }
            header.classList.toggle('is-stuck', light);
            const page = document.scrollingElement;
            updateCompactHeader(Math.max(0, Math.min(y, page.scrollHeight - page.clientHeight)), floor);
        }
    }
    if (toTop) toTop.classList.toggle('is-visible', y > window.innerHeight * 0.8);
    if (toTop && footer) {
        // Over the teal footer the button turns to glass; it switches once
        // the footer lies under all of it, so no edge ever runs through it.
        const b = toTop.getBoundingClientRect();
        toTop.classList.toggle('is-on-dark', footer.getBoundingClientRect().top <= b.top - 4);
    }
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
// Leaving the menu starts the pause again, so the bar then hides as usual.
header?.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') header.classList.add('is-pointer-in');
});
header?.addEventListener('pointerleave', () => {
    header.classList.remove('is-pointer-in');
    onScroll();
});
wideHeader.addEventListener('change', () => {
    clearTimeout(idleTimer);
    setLock();
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

// The switch for the teal glass bar: inner pages, wide screens, under the bar at the top left.
if (header && !switching) {
    const box = document.createElement("div");
    box.className = "kovpack-look-switch kovpack-bar-switch";
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "Бар при прокрутке");
    const caption = document.createElement("span");
    caption.className = "kovpack-switch-label";
    caption.textContent = "Бар при прокрутке";
    const buttons = [["teal", "Бирюзовое стекло"], ["light", "Светлый (как было)"]].map(([value, text]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = text;
        b.dataset.look = value;
        b.addEventListener("click", () => {
            root.classList.toggle("kovpack-bar-teal", value === "teal");
            try { localStorage.setItem(tealBarKey, value); } catch (e) { /* private mode */ }
            sync();
            update();
        });
        return b;
    });
    const sync = () => {
        const teal = root.classList.contains("kovpack-bar-teal");
        for (const b of buttons) b.setAttribute("aria-pressed", String((b.dataset.look === "teal") === teal));
    };
    box.append(caption, ...buttons);
    sync();
    document.body.append(box);
}

})();
