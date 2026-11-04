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

})();
