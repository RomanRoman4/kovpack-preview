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

// Scroll reveal (owner, 2026-11-12: soft and fast). Only elements starting
// below the fold are hidden, so nothing already on screen flashes; reduced
// motion and old browsers skip it entirely. Whole sections rise in as blocks;
// the cards, rows and tiles inside them follow one after another. One
// observer for everything, and only opacity and transform change, so the
// browser composites it without layout work.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduced && 'IntersectionObserver' in window) {
    const phone = matchMedia('(max-width: 900px)').matches;
    const targets = document.querySelectorAll([
        // The contact pair and footer stay static: they form one joined block.
        '.page__content > :not(.kovpack-product, .frame-kovpack-contact-info, .frame-kovpack-contact-form, :has(.kovpack-news))',
        // On phones the scroll itself unrolls the product cards (product-roll.js).
        phone ? null : '.page__content > .kovpack-product',
        '.kovpack-about > *',
        '.kovpack-news__heading',
        '.kovpack-news__card',
        // Repeatable items inside the blocks.
        '.kovpack-pdp__uses-head, .kovpack-pdp__use, .kovpack-pdp__traits-title, .kovpack-pdp__trait',
        '.kovpack-pdp__media-head, .kovpack-pdp__video',
        '.kovpack-about__pillar, .kovpack-offer__summary, .kovpack-offer__step',
        // Repeatable blocks inside composed pages opt in with data-reveal.
        '[data-reveal]',
    ].filter(Boolean).join(','));
    let batch = 0;
    let batchTimer = 0;
    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            // Elements that come in together follow each other by a beat.
            entry.target.style.setProperty('--reveal-delay', `${Math.min(batch, 5) * 0.07}s`);
            batch += 1;
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
        }
        clearTimeout(batchTimer);
        batchTimer = setTimeout(() => { batch = 0; }, 120);
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    const fold = window.innerHeight;
    for (const target of targets) {
        if (target.getBoundingClientRect().top < fold * 0.94) continue;
        target.classList.add('kovpack-reveal');
        observer.observe(target);
    }
    // Once shown, an element drops its reveal styles (no lingering transition).
    addEventListener('transitionend', (event) => {
        const target = event.target;
        if (event.propertyName !== 'transform' || !target.classList?.contains('is-revealed')) return;
        target.classList.remove('kovpack-reveal', 'is-revealed');
        target.style.removeProperty('--reveal-delay');
    });
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
    nav.append(drop); // last: the theme spaces any element that follows another
    nav.classList.add('has-drop');
    const active = () => items.find((item) => item.classList.contains('header__nav-item--active'));
    // The item under the drop is marked, so its text colour follows the drop
    // (not :hover, which is lost in the gaps between items).
    const mark = (item) => { for (const other of items) other.classList.toggle("is-dropped", other === item); };
    let last = null;
    const place = (item, animate) => {
        if (!item || !wide.matches) { drop.style.opacity = '0'; last = null; mark(null); return; }
        mark(item);
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

// Liquid-glass menu below 1280px (owner, 2026-11-12). The theme script
// (main.js) still opens and closes it; this layer adds what a floating pane
// needs: the bar stays pinned while the pane fades out (.is-menu-open is
// removed after the close animation), the pane starts right under the bar,
// a tap on the dimmed page or Escape closes it, the menu button works as a
// real button, the language choices stay readable as one segmented pill,
// and a glass drop rests on the current item and flows to the item touched.
(() => {
    const header = document.querySelector('.header');
    const menu = document.getElementById('navigation');
    const button = document.querySelector('.JS_header-menu-button');
    const pane = menu?.querySelector('.header__nav');
    if (!header || !menu || !button || !pane) return;
    const narrow = window.matchMedia('(max-width: 1279px)');
    const isOpen = () => menu.classList.contains('header__menu--open');

    button.setAttribute('role', 'button');
    button.setAttribute('aria-controls', 'navigation');
    button.setAttribute('aria-expanded', 'false');
    if (!button.hasAttribute('tabindex')) button.tabIndex = 0;
    button.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        button.click();
    });

    // Language choices: always listed in the pane, never hidden from readers.
    const languageMenus = [...menu.querySelectorAll('.JS_header-language-menu')];
    const showLanguages = () => {
        if (!narrow.matches) return;
        for (const list of languageMenus) if (list.getAttribute('aria-hidden') !== 'false') list.setAttribute('aria-hidden', 'false');
    };
    for (const list of languageMenus) new MutationObserver(showLanguages).observe(list, { attributes: true, attributeFilter: ['aria-hidden'] });
    for (const languageButton of menu.querySelectorAll('.JS_header-language-button')) {
        const sync = () => { if (narrow.matches) languageButton.tabIndex = -1; else languageButton.removeAttribute('tabindex'); };
        sync();
        narrow.addEventListener('change', sync);
    }

    // The current page in a submenu is marked (the theme only marks the group).
    for (const link of pane.querySelectorAll('.header__subnav-item[href]')) {
        const url = new URL(link.href, location.href);
        if (!url.hash && url.pathname === location.pathname && !link.closest('.header__subnav-list-item--overview')) link.setAttribute('aria-current', 'page');
    }

    // The drop: positioned by offsets, so the pane's own scale-in never skews it.
    const items = [...pane.querySelectorAll('.header__nav-item')];
    const drop = document.createElement('span');
    drop.className = 'kovpack-menu-drop';
    drop.setAttribute('aria-hidden', 'true');
    pane.append(drop); // last: the theme spaces any element that follows another
    const current = () => items.find((item) => item.classList.contains('header__nav-item--active'));
    let dropItem = null;
    const place = (item, animate) => {
        if (!item || !narrow.matches) { drop.style.opacity = '0'; dropItem = null; return; }
        const row = item.offsetParent === pane ? item : item.closest('.header__nav-list-item');
        const top = (row === item ? 0 : item.offsetTop) + (row?.offsetTop ?? 0);
        if (!animate) drop.style.transition = 'none';
        drop.style.transform = `translateY(${top}px)`;
        drop.style.height = `${item.offsetHeight}px`;
        drop.style.opacity = '1';
        if (!animate) { void drop.offsetWidth; drop.style.transition = ''; }
        if (animate && dropItem && dropItem !== item) {
            drop.classList.remove('is-moving');
            void drop.offsetWidth;
            drop.classList.add('is-moving');
        }
        dropItem = item;
    };
    for (const item of items) {
        item.addEventListener('pointerdown', () => place(item, true));
        item.addEventListener('focus', () => place(item, true));
    }
    // Submenus fold open and shift the rows below: follow them.
    if ('ResizeObserver' in window) new ResizeObserver(() => dropItem && place(dropItem, false)).observe(pane);
    pane.addEventListener('transitionend', (event) => {
        if (event.target.classList?.contains('header__subnav') && dropItem) place(dropItem, true);
    });

    let closing = 0;
    const sync = () => {
        const open = isOpen();
        button.setAttribute('aria-expanded', String(open));
        window.clearTimeout(closing);
        if (open) {
            // The theme locks the body, which with the page's overflow-x on
            // <html> throws the page back to the top; lock <html> instead,
            // which keeps the reading position behind the menu.
            document.body.style.overflow = '';
            document.documentElement.style.overflow = 'hidden';
            header.classList.add('is-menu-open');
            const bottom = header.getBoundingClientRect().bottom;
            menu.style.setProperty('--menu-top', `${Math.round(bottom + 6)}px`);
            showLanguages();
            place(current(), false);
        } else {
            document.documentElement.style.overflow = '';
            // Pinned until the pane has faded, then the bar returns to its place.
            closing = window.setTimeout(() => header.classList.remove('is-menu-open'), 460);
        }
    };
    new MutationObserver(sync).observe(menu, { attributes: true, attributeFilter: ['class'] });
    menu.addEventListener('click', (event) => {
        if (!isOpen()) return;
        if (event.target === menu) { button.click(); return; }
        // A link to a section of this same page (Kontakt on the home page).
        const link = event.target.closest('a[href]');
        if (!link || link.matches('.JS_header_subnav_link')) return;
        const url = new URL(link.href, location.href);
        if (url.hash && url.pathname === location.pathname) button.click();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !isOpen()) return;
        button.click();
        button.focus();
    });
    narrow.addEventListener('change', () => {
        if (narrow.matches) return;
        header.classList.remove('is-menu-open');
        document.documentElement.style.overflow = '';
    });
})();

// Submenu drop (owner, 2026-11-13): the dropdowns get the same glass drop
// as the menu bar. It appears under the pointer, flows between the items
// (stretching vertically) and fades out when the pointer leaves.
for (const list of document.querySelectorAll('.header__subnav')) {
    const wide = window.matchMedia('(min-width: 1280px)');
    const items = [...list.querySelectorAll('.header__subnav-item')]
        .filter((item) => !item.closest('.header__subnav-list-item--back'));
    if (!items.length) continue;
    const drop = document.createElement('span');
    drop.className = 'kovpack-nav-drop kovpack-subnav-drop';
    drop.setAttribute('aria-hidden', 'true');
    list.append(drop);
    list.classList.add('has-drop');
    // The item under the drop is marked, so its text colour follows the drop
    // (not :hover, which is lost in the gaps between items).
    const mark = (item) => { for (const other of items) other.classList.toggle("is-dropped", other === item); };
    let last = null;
    const place = (item, animate) => {
        if (!item || !wide.matches) { drop.style.opacity = '0'; last = null; mark(null); return; }
        mark(item);
        const box = item.getBoundingClientRect();
        const outer = list.getBoundingClientRect();
        const left = box.left - outer.left - list.clientLeft;
        const top = box.top - outer.top - list.clientTop;
        const fresh = last === null;
        const down = !fresh && top > last;
        drop.style.transitionDuration = animate && !fresh
            ? (down ? ['.3s', '.3s', '.5s', '.26s', '.3s'] : ['.3s', '.3s', '.26s', '.5s', '.3s']).join(', ')
            : '0s, 0s, 0s, 0s, .25s';
        drop.style.left = left + 'px';
        drop.style.right = (list.clientWidth - left - box.width) + 'px';
        drop.style.top = top + 'px';
        drop.style.bottom = (list.clientHeight - top - box.height) + 'px';
        drop.style.opacity = '1';
        if (animate && !fresh && top !== last) {
            drop.classList.remove('is-moving');
            void drop.offsetWidth;
            drop.classList.add('is-moving');
        }
        last = top;
    };
    for (const item of items) {
        item.addEventListener('pointerenter', () => place(item, true));
        item.addEventListener('focus', () => place(item, true));
    }
    list.addEventListener('pointerleave', () => place(null, true));
    list.addEventListener('focusout', (event) => { if (!list.contains(event.relatedTarget)) place(null, true); });
    wide.addEventListener('change', () => place(null, false));
}

// Product page actions (owner, 2026-11-17): no flowing drop any more.
// "Angebot anfragen" keeps its product colour and its own hover; "Alle
// Produkte" keeps its own soft tint.

// Menu look switches over the home photo (owner, 2026-11-17): compare the
// teal glass menu with the earlier clear white glass, and the glass with or
// without its thin white outline. Only where the photo hero is and on wide
// screens; each choice is kept for this browser.
(() => {
    if (!document.querySelector(".header + .hero:not(.hero--text-only, .hero--small)")) return;
    const root = document.documentElement;
    const read = (key) => { try { return localStorage.getItem(key); } catch (e) { return null; } };
    const write = (key, value) => { try { localStorage.setItem(key, value); } catch (e) {} };
    // One segmented pill: the first option is the look without the class.
    const group = (label, key, cls, first, second, startOn) => {
        const saved = read(key);
        root.classList.toggle(cls, saved ? saved === second[0] : startOn);
        const box = document.createElement("div");
        box.className = "kovpack-look-switch";
        box.setAttribute("role", "group");
        box.setAttribute("aria-label", label);
        const caption = document.createElement("span");
        caption.className = "kovpack-switch-label";
        caption.textContent = label;
        box.append(caption);
        const buttons = [first, second].map(([value, text]) => {
            const b = document.createElement("button");
            b.type = "button";
            b.textContent = text;
            b.dataset.look = value;
            b.addEventListener("click", () => {
                root.classList.toggle(cls, value === second[0]);
                write(key, value);
                sync();
            });
            return b;
        });
        const sync = () => {
            const on = root.classList.contains(cls);
            for (const b of buttons) b.setAttribute("aria-pressed", String((b.dataset.look === second[0]) === on));
        };
        box.append(...buttons);
        sync();
        return box;
    };
    const wrap = document.createElement("div");
    wrap.className = "kovpack-look-switches";
    wrap.append(
        group("Меню на фото", "kovpack-nav-look", "kovpack-nav-clear", ["teal", "Бирюза"], ["clear", "Прозрачное"], false),
        group("Обводка меню", "kovpack-nav-line", "kovpack-nav-noline", ["line", "Есть"], ["noline", "Нет"], true),
    );
    // Top right of the photo, right under the menu bar and lined up with it,
    // next to the big headline, so the looks can be compared in place. They
    // sit on the page itself, above the header, whose tall box with the large
    // logo would otherwise cover them and take their clicks.
    const nav = document.querySelector(".header__nav");
    document.body.append(wrap);
    const place = () => {
        if (!nav) return;
        const n = nav.getBoundingClientRect();
        wrap.style.top = Math.round(n.bottom + scrollY + 14) + "px";
        wrap.style.right = Math.round(document.documentElement.clientWidth - n.right) + "px";
    };
    addEventListener("resize", place);
    document.fonts?.ready.then(place);
    place();
    setTimeout(place, 0);
})();

// "Alle Produkte" hover switch (owner, 2026-11-17): on product pages, at the
// right end of the action row, to compare the brand-teal hover with a hover in
// the product's own colour. Kept per browser.
(() => {
    const row = document.querySelector(".kovpack-pdp__actions");
    if (!row || !row.querySelector(".kovpack-pdp__back")) return;
    const root = document.documentElement;
    const key = "kovpack-back-hover";
    let saved = null;
    try { saved = localStorage.getItem(key); } catch (e) {}
    root.classList.toggle("kovpack-back-product", saved === "product");
    const box = document.createElement("div");
    box.className = "kovpack-look-switch kovpack-back-switch";
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "Ховер «Alle Produkte»");
    const caption = document.createElement("span");
    caption.className = "kovpack-switch-label";
    caption.textContent = "Ховер «Alle Produkte»";
    box.append(caption);
    const buttons = [["brand", "Бренд"], ["product", "Цвет продукта"]].map(([value, text]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = text;
        b.dataset.look = value;
        b.addEventListener("click", () => {
            root.classList.toggle("kovpack-back-product", value === "product");
            try { localStorage.setItem(key, value); } catch (e) {}
            for (const other of buttons) other.setAttribute("aria-pressed", String(other === b));
        });
        b.setAttribute("aria-pressed", String((value === "product") === root.classList.contains("kovpack-back-product")));
        return b;
    });
    box.append(...buttons);
    row.append(box);
})();

// Submenu drip (owner, 2026-11-18): the drop forms on the bar's lower edge
// under the centre of its menu item, so each item tells its panel where that
// is and how far down the bar's edge lies. Moving straight from one open
// group to the next sets .is-menu-swap on the header, so the next panel is
// there at once instead of dripping again.
(() => {
    const header = document.querySelector(".header");
    if (!header) return;
    const nav = header.querySelector(".header__nav");
    const set = (item, panel) => {
        // The edge the panel hangs from: the bar, or over the home photo
        // (no bar yet) the menu pill.
        // The panel hangs from the menu pill and takes its colour.
        const edge = (nav || header).getBoundingClientRect().bottom;
        const gap = Math.max(0, Math.round(edge - item.getBoundingClientRect().bottom));
        item.style.setProperty("--drip-gap", gap + "px");
        // The resting page starts under the bar; over the home photo (no
        // bar yet) it covers the whole view.
        const bar = header.matches(".is-stuck, .is-scrolled") || !header.matches(":has(+ .hero:not(.hero--text-only, .hero--small))");
        document.documentElement.style.setProperty("--kovpack-header-bottom", bar ? Math.max(0, Math.round(header.getBoundingClientRect().bottom)) + "px" : "0px");
        // The curves only where the pill reaches at least a curve's width
        // past the panel's side; else they would stick out beyond it.
        const target = panel || item.querySelector(".header__language-menu");
        if (target && nav) {
            const p = nav.getBoundingClientRect(), i = item.getBoundingClientRect();
            const w = target.offsetWidth;
            const left = panel ? i.left : i.right - w;
            target.style.setProperty("--drip-curve-l", left - p.left >= 14 ? "1" : "0");
            target.style.setProperty("--drip-curve-r", p.right - (left + w) >= 14 ? "1" : "0");
        }
        if (!panel) return;
        panel.style.setProperty("--drip-x", Math.round(item.offsetWidth / 2) + "px");
        panel.style.setProperty("--drip-cl", "0px");
        panel.style.setProperty("--drip-cr", "calc(100% - " + item.offsetWidth + "px)");
        item.style.setProperty("--drip-w", panel.offsetWidth + "px");
        item.style.setProperty("--drip-reach", gap + panel.offsetHeight + "px");
    };
    let leftGroupAt = -Infinity;
    for (const li of document.querySelectorAll(".header__nav-list-item")) {
        const panel = li.querySelector(":scope > .header__subnav");
        li.addEventListener("pointerenter", () => {
            set(li, panel);
            // A group with a panel, reached within the old panel's close
            // delay: swap. Anything else: the normal drip.
            header.classList.toggle("is-menu-swap", Boolean(panel) && performance.now() - leftGroupAt < 420);
        });
        li.addEventListener("pointerleave", () => { if (panel) leftGroupAt = performance.now(); });
        li.addEventListener("focusin", () => set(li, panel));
        set(li, panel);
    }
    header.querySelector(".header__nav")?.addEventListener("pointerleave", () => header.classList.remove("is-menu-swap"));
    for (const d of document.querySelectorAll(".header__language-dropdown")) {
        d.addEventListener("pointerenter", () => set(d, null));
        set(d, null);
    }
})();

})();
