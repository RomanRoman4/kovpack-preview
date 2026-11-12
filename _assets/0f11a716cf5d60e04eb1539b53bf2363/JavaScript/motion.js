(() => {
"use strict";
// Progressive motion: content is complete and visible without this script.

// Hero slideshow: one slide every 5 seconds with a roll transition. Progress
// bars select a slide; reduced motion keeps the first photo (no autoplay), and
// without JavaScript the first photo simply stays.
for (const stage of document.querySelectorAll('[data-hero-slides]')) {
    const slides = [...stage.querySelectorAll('[data-hero-slide]')];
    if (slides.length < 2) continue;
    const interval = 5000;
    const hero = stage.closest('.hero') ?? stage.parentElement;
    const controls = document.createElement('div');
    controls.className = 'kovpack-hero-controls';
    controls.style.setProperty('--hero-interval', `${interval}ms`);
    const dots = slides.map((slide, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'kovpack-hero-dot';
        dot.setAttribute('aria-label', stage.dataset.labelSlide.replace('%s', String(index + 1)));
        dot.addEventListener('click', () => { show(index); restart(); });
        return dot;
    });
    controls.append(...dots);
    hero.append(controls);

    let current = 0;
    let timer = 0;
    const paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mark = () => dots.forEach((dot, index) => dot.setAttribute('aria-current', String(index === current)));
    const show = (next) => {
        if (next === current) return;
        const previous = slides[current];
        slides.forEach((slide) => slide.classList.remove('is-leaving', 'is-entering'));
        previous.classList.remove('is-active');
        previous.classList.add('is-leaving');
        const incoming = slides[next];
        incoming.classList.add('is-active', 'is-entering');
        stage.classList.remove('is-rolling');
        void stage.offsetWidth; // restart the roll animation
        stage.classList.add('is-rolling');
        current = next;
        mark();
    };
    const tick = () => show((current + 1) % slides.length);
    const restart = () => {
        clearInterval(timer);
        if (!paused && !document.hidden) timer = setInterval(tick, interval);
    };
    controls.classList.toggle('is-paused', paused);
    document.addEventListener('visibilitychange', restart);
    mark();
    restart();
}

// Scroll reveal. Only elements starting below the fold are hidden, so nothing
// already on screen flashes; reduced motion and old browsers skip it entirely.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduced && 'IntersectionObserver' in window) {
    const targets = document.querySelectorAll([
        // The contact pair and footer stay static: they form one joined block.
        '.page__content > :not(.kovpack-product, .frame-kovpack-contact-info, .frame-kovpack-contact-form, :has(.kovpack-news))',
        '.kovpack-news__heading',
        '.page__content > .kovpack-product',
        '.kovpack-news__card',
        // Repeatable blocks inside composed pages opt in with data-reveal.
        '[data-reveal]',
    ].join(','));
    const observer = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        visible.forEach((entry, index) => {
            entry.target.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 0.09}s`);
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    const fold = window.innerHeight;
    for (const target of targets) {
        if (target.closest('.kovpack-reveal')) continue;
        if (target.getBoundingClientRect().top < fold * 0.92) continue;
        target.classList.add('kovpack-reveal');
        observer.observe(target);
    }
    // Printing and in-page anchors must never leave hidden content behind.
    const revealAll = () => document.querySelectorAll('.kovpack-reveal').forEach((element) => element.classList.add('is-revealed'));
    addEventListener('beforeprint', revealAll);
    addEventListener('hashchange', revealAll);
}

// Menu drop (owner, 2026-11-12): as in the enquiry form, one glass drop
// rests on the current page's item and flows to the item under the pointer;
// its leading edge moves first so it stretches and settles like a drop.
// Desktop menu only; without this script the items keep their own tint.
for (const nav of document.querySelectorAll('.header__nav')) {
    const wide = window.matchMedia('(min-width: 1280px)');
    const items = [...nav.querySelectorAll('.header__nav-item')];
    if (!items.length) continue;
    const drop = document.createElement('span');
    drop.className = 'kovpack-nav-drop';
    drop.setAttribute('aria-hidden', 'true');
    nav.prepend(drop);
    nav.classList.add('has-drop');
    const active = () => items.find((item) => item.classList.contains('header__nav-item--active'));
    let last = null;
    const place = (item, animate) => {
        if (!item || !wide.matches) { drop.style.opacity = '0'; last = null; return; }
        const box = item.getBoundingClientRect();
        const outer = nav.getBoundingClientRect();
        const left = box.left - outer.left - nav.clientLeft;
        const top = box.top - outer.top - nav.clientTop;
        const right = nav.clientWidth - left - box.width;
        const fresh = last === null || drop.style.opacity === '0';
        const toRight = !fresh && left > last;
        drop.style.transitionDuration = animate && !fresh
            ? (toRight ? ['.5s', '.26s', '.3s', '.3s', '.3s'] : ['.26s', '.5s', '.3s', '.3s', '.3s']).join(', ')
            : '0s, 0s, 0s, 0s, .3s';
        drop.style.left = left + 'px';
        drop.style.right = right + 'px';
        drop.style.top = top + 'px';
        drop.style.height = box.height + 'px';
        drop.style.opacity = '1';
        if (animate && !fresh && left !== last) {
            drop.classList.remove('is-moving');
            void drop.offsetWidth;
            drop.classList.add('is-moving');
        }
        last = left;
    };
    for (const item of items) {
        item.addEventListener('pointerenter', () => place(item, true));
        item.addEventListener('focus', () => place(item, true));
    }
    nav.addEventListener('pointerleave', () => place(active(), true));
    nav.addEventListener('focusout', (event) => { if (!nav.contains(event.relatedTarget)) place(active(), true); });
    const reset = () => place(active(), false);
    window.addEventListener('resize', reset);
    wide.addEventListener('change', reset);
    document.fonts?.ready.then(reset);
    if ('ResizeObserver' in window) new ResizeObserver(() => place(nav.matches(':hover') ? items.find((i) => i.matches(':hover')) ?? active() : active(), false)).observe(nav);
    reset();
}

})();
