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

const wideHeader = window.matchMedia('(min-width: 1280px) and (hover: hover)');

// Menu drop (owner, 2026-11-12): as in the enquiry form, one glass drop
// rests on the current page's item and flows to the item under the pointer;
// its leading edge moves first so it stretches and settles like a drop.
// Desktop menu only; without this script the items keep their own tint.
for (const nav of document.querySelectorAll('.header__nav')) {
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
        if (!item || !wideHeader.matches) { drop.style.opacity = '0'; last = null; mark(null); return; }
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
    wideHeader.addEventListener('change', reset);
    document.fonts?.ready.then(reset);
    if ('ResizeObserver' in window) new ResizeObserver(() => place(nav.matches(':hover') ? items.find((i) => i.matches(':hover')) ?? active() : active(), false)).observe(nav);
    reset();
}

// Liquid-glass menu for narrow and touch-only viewports (owner, 2026-11-12). The theme script
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
        if (wideHeader.matches) return;
        for (const list of languageMenus) if (list.getAttribute('aria-hidden') !== 'false') list.setAttribute('aria-hidden', 'false');
    };
    for (const list of languageMenus) new MutationObserver(showLanguages).observe(list, { attributes: true, attributeFilter: ['aria-hidden'] });
    for (const languageButton of menu.querySelectorAll('.JS_header-language-button')) {
        const sync = () => { if (!wideHeader.matches) languageButton.tabIndex = -1; else languageButton.removeAttribute('tabindex'); };
        sync();
        wideHeader.addEventListener('change', sync);
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
        if (!item || wideHeader.matches) { drop.style.opacity = '0'; dropItem = null; return; }
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
    // Liquid-glass submenus (owner, 2026-11-19): each list opens to its
    // measured height (--sub-h) on a spring, its row turns into a glass well
    // (.is-unfolded) and only one group stays open at a time.
    const subnavs = [...pane.querySelectorAll('.header__subnav')];
    const measure = (list) => {
        const last = [...list.querySelectorAll(':scope > li')].pop(); // not the drop span
        list.style.setProperty('--sub-h', `${last ? last.offsetTop + last.offsetHeight : 0}px`);
    };
    const measureAll = () => { if (!wideHeader.matches) subnavs.forEach(measure); };
    for (const list of subnavs) {
        const row = list.closest('.header__nav-list-item');
        const syncList = () => {
            const open = list.classList.contains('header__subnav--active') && !wideHeader.matches;
            if (open) {
                measure(list);
                for (const other of subnavs) {
                    if (other === list || !other.classList.contains('header__subnav--active')) continue;
                    other.classList.remove('header__subnav--active');
                    pane.querySelector(`[data-target="${other.id}"]`)?.setAttribute('aria-expanded', 'false');
                }
            }
            row?.classList.toggle('is-unfolded', open);
        };
        new MutationObserver(syncList).observe(list, { attributes: true, attributeFilter: ['class'] });
        syncList();
    }
    window.addEventListener('resize', measureAll);
    document.fonts?.ready.then(measureAll);
    wideHeader.addEventListener('change', () => subnavs.forEach((list) => list.closest('.header__nav-list-item')?.classList.remove('is-unfolded')));

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
            menu.style.setProperty('--menu-top', `${header.offsetHeight + 6}px`);
            showLanguages();
            measureAll();
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
    wideHeader.addEventListener('change', () => {
        if (!wideHeader.matches) return;
        header.classList.remove('is-menu-open');
        document.documentElement.style.overflow = '';
    });
})();

// Submenu drop (owner, 2026-11-13): the dropdowns get the same glass drop
// as the menu bar. It appears under the pointer, flows between the items
// (stretching vertically) and fades out when the pointer leaves. The
// language list gets the same drop (owner, 2026-11-18).
for (const list of document.querySelectorAll('.header__subnav, .header__language-menu')) {
    const items = [...list.querySelectorAll('.header__subnav-item, .header__language-menu-link')]
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
        if (!item || !wideHeader.matches) { drop.style.opacity = '0'; last = null; mark(null); return; }
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
    wideHeader.addEventListener('change', () => place(null, false));
}

// Product page actions (owner, 2026-11-17): no flowing drop any more.
// "Angebot anfragen" keeps its product colour and its own hover; "Alle
// Produkte" keeps its own soft tint.

// The menu look switch over the home photo is gone (owner, 2026-11-21): the
// brand-teal glass is the one look there.

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
        // With the flyout the panel hangs a neck's length below its item.
        const neck = nav?.classList.contains("has-flyout") && parseFloat(getComputedStyle(nav).getPropertyValue("--fly-neck"));
        const edge = (nav || header).getBoundingClientRect().bottom;
        const gap = neck || Math.max(0, Math.round(edge - item.getBoundingClientRect().bottom));
        item.style.setProperty("--drip-gap", gap + "px");
        // The resting page starts under the bar; over the home photo (no
        // bar yet, or the clear docked bar) it covers the whole view.
        const bar = header.matches(".is-stuck, .is-scrolled") || !header.matches(":has(+ .hero:not(.hero--text-only, .hero--small))");
        // The docked bar slides in and out, so take its resting height, not
        // where it is mid-slide: else the layer starts inside the bar and
        // shows through it.
        const bottom = header.matches(".is-docked") ? header.offsetHeight : header.getBoundingClientRect().bottom;
        document.documentElement.style.setProperty("--kovpack-header-bottom", bar ? Math.max(0, Math.round(bottom)) + "px" : "0px");
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
    // (.is-menu-swap is set by the flyout below.)
    for (const li of document.querySelectorAll(".header__nav-list-item")) {
        const panel = li.querySelector(":scope > .header__subnav");
        li.addEventListener("pointerenter", () => set(li, panel));
        li.addEventListener("focusin", () => set(li, panel));
        set(li, panel);
    }
    for (const d of document.querySelectorAll(".header__language-dropdown")) {
        d.addEventListener("pointerenter", () => set(d, null));
        set(d, null);
    }
})();

// Menu flyout (owner, 2026-11-18: open the submenus the Apple way, and
// moving from one open group to the next must flow, not appear anew;
// 2026-11-24: the open item and its panel are one opaque drop). One shared
// pane in the menu paints the open item and its submenu or language list as
// one solid shape: the item, a neck straight down from it, and the panel,
// joined over concave fillets where the panel reaches past the item. The
// outline is a clip path with the same commands in every state, so the
// browser morphs it: it grows down out of the item on open, glides with
// the item to the next group, and draws back up into the item on close.
// The panels themselves only hold the labels, which cross-fade. Hover
// intent matches the CSS (90 ms); within 260 ms of leaving a group, the
// next one morphs instead of opening again (.is-menu-swap).
(() => {
    const header = document.querySelector(".header");
    const nav = header?.querySelector(".header__nav");
    if (!nav) return;
    const desk = window.matchMedia("(min-width: 1280px) and (hover: hover)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fly = document.createElement("span");
    fly.className = "kovpack-nav-flyout";
    fly.setAttribute("aria-hidden", "true");
    nav.append(fly);
    nav.classList.add("has-flyout");
    // Fillet into the panel, the panel's free top corner, its lower corners.
    const FILLET = 14, CORNER = 16, BOTTOM = 20;
    let current = null, hiddenAt = -Infinity, openTimer = 0, swapTimer = 0;
    const itemOf = (panel) => panel.closest(".header__nav-list-item, .header__language-dropdown")
        ?.querySelector(".header__nav-item, .header__language-button");
    const rel = (el) => {
        const n = nav.getBoundingClientRect(), b = el.getBoundingClientRect();
        return { x: b.left - n.left - nav.clientLeft, y: b.top - n.top - nav.clientTop, w: b.width, h: b.height };
    };
    const n1 = (v) => Math.round(v * 10) / 10;
    // The shape for a panel, open or drawn up into its item.
    const shape = (panel, open) => {
        const item = itemOf(panel) || panel;
        const I = rel(item);
        const rt = parseFloat(getComputedStyle(nav.querySelector(".kovpack-nav-drop") || item).borderTopLeftRadius) || 12;
        const ix = I.x, ir = I.x + I.w, iy = I.y, ib = I.y + I.h;
        if (!open) return { ix, ir, iy, ib, rt, L: ix, R: ir, top: ib - rt, bot: ib, fl: 0, fr: 0, cl: 0, cr: 0, rb: rt };
        const P = rel(panel);
        const top = Math.max(P.y, ib), bot = Math.max(P.y + P.h, top + 2 * BOTTOM);
        const f = Math.min(FILLET, top - ib), room = f + CORNER;
        // A side within 8 px of the item runs straight down; one further out
        // gets a fillet and a corner, with room for both.
        const side = (d) => (d <= 8 ? 0 : Math.max(d, room));
        const dl = side(ix - Math.min(P.x, ix)), dr = side(Math.max(P.x + P.w, ir) - ir);
        return {
            open: true, ix, ir, iy, ib, rt, L: ix - dl, R: ir + dr, top, bot,
            fl: dl ? f : 0, fr: dr ? f : 0, cl: dl ? CORNER : 0, cr: dr ? CORNER : 0, rb: BOTTOM,
        };
    };
    const draw = (s) => {
        const h = header.getBoundingClientRect(), n = nav.getBoundingClientRect();
        const ox = h.left - n.left - nav.clientLeft, oy = h.top - n.top - nav.clientTop;
        const X = (v) => n1(v - ox), Y = (v) => n1(v - oy);
        const { ix, ir, iy, ib, rt, L, R, top, bot, fl, fr, cl, cr, rb } = s;
        const path = [
            `M${X(ix)} ${Y(iy + rt)}`, `A${rt} ${rt} 0 0 1 ${X(ix + rt)} ${Y(iy)}`,
            `H${X(ir - rt)}`, `A${rt} ${rt} 0 0 1 ${X(ir)} ${Y(iy + rt)}`,
            `V${Y(top - fr)}`, `A${fr} ${fr} 0 0 0 ${X(ir + fr)} ${Y(top)}`,
            `H${X(R - cr)}`, `A${cr} ${cr} 0 0 1 ${X(R)} ${Y(top + cr)}`,
            `V${Y(bot - rb)}`, `A${rb} ${rb} 0 0 1 ${X(R - rb)} ${Y(bot)}`,
            `H${X(L + rb)}`, `A${rb} ${rb} 0 0 1 ${X(L)} ${Y(bot - rb)}`,
            `V${Y(top + cl)}`, `A${cl} ${cl} 0 0 1 ${X(L + cl)} ${Y(top)}`,
            `H${X(ix - fl)}`, `A${fl} ${fl} 0 0 0 ${X(ix)} ${Y(top - fl)}`, "Z",
        ].join(" ");
        fly.style.setProperty("--fly-fx", n1(ox) + "px");
        fly.style.setProperty("--fly-fy", n1(oy) + "px");
        fly.style.setProperty("--fly-fw", n1(h.width) + "px");
        fly.style.setProperty("--fly-fh", n1(Math.max(bot - oy + 80, h.height)) + "px");
        fly.style.setProperty("--fly-path", `path("${path}")`);
        fly.style.setProperty("--fly-sx", n1(L) + "px");
        fly.style.setProperty("--fly-sy", n1(top) + "px");
        fly.style.setProperty("--fly-sw", n1(R - L) + "px");
        fly.style.setProperty("--fly-sh", n1(bot - top) + "px");
        fly.style.setProperty("--fly-sr", `${cl}px ${cr}px ${rb}px ${rb}px`);
        // The shading runs with the item and, once open, down to the panel's
        // foot; drawing back up keeps it, so the colours stay put.
        fly.style.setProperty("--fly-iy", n1(iy - oy) + "px");
        fly.style.setProperty("--fly-ib", n1(ib - oy) + "px");
        if (s.open) fly.style.setProperty("--fly-pb", n1(bot - oy) + "px");
    };
    const show = (panel) => {
        clearTimeout(openTimer);
        if (!desk.matches || current === panel) return;
        const flowing = current !== null || performance.now() - hiddenAt < 260;
        // While a pane is out, any next group is a swap. The class is on
        // before the pointer reaches the next item, because the browser
        // starts that item's transitions as soon as it is hovered.
        clearTimeout(swapTimer);
        header.classList.add("is-menu-swap");
        if (!flowing && !still.matches) {
            // Grow from the item: start as the item's own highlight.
            fly.classList.add("is-instant");
            draw(shape(panel, false));
            getComputedStyle(fly, "::after").clipPath;
            fly.classList.remove("is-instant");
        }
        nav.classList.toggle("is-flowing", panel.classList.contains("header__subnav"));
        fly.classList.add("is-shown");
        draw(shape(panel, true));
        current = panel;
    };
    const hide = () => {
        clearTimeout(openTimer);
        if (!current) return;
        if (!still.matches) draw(shape(current, false));
        current = null;
        hiddenAt = performance.now();
        fly.classList.remove("is-shown");
        nav.classList.remove("is-flowing");
        clearTimeout(swapTimer);
        swapTimer = setTimeout(() => header.classList.remove("is-menu-swap"), 260);
    };
    for (const li of nav.querySelectorAll(".header__nav-list-item")) {
        const panel = li.querySelector(":scope > .header__subnav");
        li.addEventListener("pointerenter", (event) => {
            if (event.pointerType !== "mouse") return;
            closeLanguages();
            if (!panel) { hide(); return; }
            // Moving on from an open group flows at once; a fresh open waits
            // for the same hover intent as the CSS.
            if (current || performance.now() - hiddenAt < 260) show(panel);
            else { clearTimeout(openTimer); openTimer = setTimeout(() => li.matches(":hover") && show(panel), 90); }
        });
        li.addEventListener("pointerleave", (event) => {
            if (event.pointerType !== "mouse") return;
            clearTimeout(openTimer);
            if (current === panel) hide();
        });
        if (panel) {
            li.addEventListener("focusin", () => show(panel));
            li.addEventListener("focusout", (event) => { if (!li.contains(event.relatedTarget) && current === panel) hide(); });
        }
    }
    // The language list opens like the other groups on a wide screen: on
    // hover, with the same intent, and the pane flows to it from an open
    // group. (The theme opens it on a click; that stays for keyboard and
    // touch.) A click on DE/EN while it is open by hover keeps it open.
    const languageOpen = (dropdown, open) => {
        dropdown.classList.toggle("header__language-dropdown--open", open);
        dropdown.querySelector(".header__language-button")?.setAttribute("aria-expanded", String(open));
        dropdown.querySelector(".header__language-menu")?.setAttribute("aria-hidden", String(!open));
    };
    const dropdowns = [...nav.querySelectorAll(".header__language-dropdown")];
    const closeLanguages = () => { for (const d of dropdowns) if (d.classList.contains("header__language-dropdown--open")) languageOpen(d, false); };
    for (const dropdown of dropdowns) {
        dropdown.addEventListener("pointerenter", (event) => {
            if (event.pointerType !== "mouse" || !desk.matches) return;
            clearTimeout(openTimer);
            if (current || performance.now() - hiddenAt < 260) languageOpen(dropdown, true);
            else openTimer = setTimeout(() => dropdown.matches(":hover") && languageOpen(dropdown, true), 90);
        });
        dropdown.addEventListener("pointerleave", (event) => {
            if (event.pointerType !== "mouse" || !desk.matches) return;
            clearTimeout(openTimer);
            if (!dropdown.contains(document.activeElement)) languageOpen(dropdown, false);
        });
        dropdown.querySelector(".header__language-button")?.addEventListener("click", (event) => {
            if (desk.matches && event.pointerType === "mouse" && dropdown.classList.contains("header__language-dropdown--open")) event.stopImmediatePropagation();
        }, true);
    }
    for (const dropdown of dropdowns) {
        const menu = dropdown.querySelector(".header__language-menu");
        if (!menu) continue;
        new MutationObserver(() => {
            if (dropdown.classList.contains("header__language-dropdown--open")) show(menu);
            else if (current === menu) hide();
        }).observe(dropdown, { attributes: true, attributeFilter: ["class"] });
    }
    desk.addEventListener("change", () => { current = null; fly.classList.remove("is-shown"); nav.classList.remove("is-flowing"); header.classList.remove("is-menu-swap"); });
})();

})();
