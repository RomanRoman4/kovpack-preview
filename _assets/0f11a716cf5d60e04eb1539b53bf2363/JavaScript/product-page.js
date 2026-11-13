(() => {
"use strict";
// Product page on phones and small tablets (owner, 2026-11-12). Three small
// aids that keep the page short; the desktop page is left as it is, and
// without this script every row, clip and the normal button simply stay.
//   1. The specification list shows its key rows; the rest folds behind a toggle.
//   2. The product videos become one player with the other clips as
//      thumbnails; a tap on a thumbnail brings that clip into the player.
//   3. A glass bar keeps the enquiry button at hand between the button at
//      the top of the page and the form at its end.
const phone = window.matchMedia('(max-width: 900px)');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const english = document.documentElement.lang.toLowerCase().startsWith('en');
const text = english
    ? { more: 'All technical data (%s)', less: 'Show less', play: 'Show video: %s' }
    : { more: 'Alle technischen Daten (%s)', less: 'Weniger anzeigen', play: 'Video zeigen: %s' };
const VISIBLE_ROWS = 5;

// 1. Specifications.
for (const list of document.querySelectorAll('.kovpack-pdp__specs')) {
    const rows = list.querySelectorAll(':scope > div');
    // Key rows (data-key: paper type, grammage, roll width and length) stay
    // visible and the rest opens on demand (owner, 2026-11-13). A list
    // without keys keeps its first rows.
    const keyed = list.querySelector(':scope > [data-key]');
    const extra = [...rows].filter((row, index) => (keyed ? !row.hasAttribute('data-key') : index >= VISIBLE_ROWS));
    if (extra.length < 2) continue;
    extra.forEach((row) => row.setAttribute('data-fold', ''));
    if (!list.id) list.id = `kovpack-specs-${Math.random().toString(36).slice(2, 8)}`;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'kovpack-pdp__specs-toggle';
    toggle.setAttribute('aria-controls', list.id);
    let open = false;
    const render = () => {
        const folded = phone.matches && !open;
        list.classList.toggle('is-folded', folded);
        toggle.hidden = !phone.matches;
        toggle.setAttribute('aria-expanded', String(!folded));
        toggle.textContent = folded ? text.more.replace('%s', String(rows.length)) : text.less;
    };
    toggle.addEventListener('click', () => {
        open = !open;
        list.classList.toggle('is-unfolding', open && !reduced.matches);
        if (!open) {
            // Folding up as smoothly as unfolding (owner, 2026-11-13): the
            // extra rows shrink and fade, and the page follows frame by frame
            // so the toggle stays under the finger instead of jumping.
            if (reduced.matches || !Element.prototype.animate) {
                const before = toggle.getBoundingClientRect().top;
                render();
                window.scrollBy({ top: toggle.getBoundingClientRect().top - before, behavior: 'instant' });
                return;
            }
            toggle.disabled = true;
            const anchor = toggle.getBoundingClientRect().top;
            const animations = extra.map((row) => {
                const style = getComputedStyle(row);
                row.style.overflow = 'hidden';
                return row.animate([
                    { height: `${row.offsetHeight}px`, paddingTop: style.paddingTop, paddingBottom: style.paddingBottom, borderBottomWidth: style.borderBottomWidth, opacity: 1 },
                    { height: '0px', paddingTop: '0px', paddingBottom: '0px', borderBottomWidth: '0px', opacity: 0 },
                ], { duration: 380, easing: 'cubic-bezier(.3, .7, .2, 1)', fill: 'forwards' });
            });
            let running = true;
            const follow = () => {
                const shift = toggle.getBoundingClientRect().top - anchor;
                if (shift) window.scrollBy({ top: shift, behavior: 'instant' });
                if (running) requestAnimationFrame(follow);
            };
            requestAnimationFrame(follow);
            // A tab in the background pauses animations: never leave the
            // toggle stuck, fold at the latest after the planned time.
            const timeout = new Promise((resolve) => { setTimeout(resolve, 520); });
            Promise.race([Promise.all(animations.map((animation) => animation.finished)), timeout]).then(() => {
                running = false;
                render();
                extra.forEach((row) => { row.style.overflow = ''; });
                animations.forEach((animation) => animation.cancel());
                follow();
                toggle.disabled = false;
            });
            return;
        }
        render();
    });
    list.after(toggle);
    phone.addEventListener('change', render);
    render();
}

// 2. Videos.
for (const list of document.querySelectorAll('.kovpack-pdp__videos')) {
    const items = [...list.querySelectorAll(':scope > .kovpack-pdp__video')];
    if (items.length < 2) continue;
    items.forEach((item, index) => { item.style.viewTransitionName = `kovpack-video-${index + 1}`; });
    let current = items[0];
    const render = () => {
        const picker = phone.matches;
        list.classList.toggle('is-picker', picker);
        list.style.setProperty('--thumbs', String(Math.min(3, Math.max(2, items.length - 1))));
        for (const item of items) {
            const thumb = picker && item !== current;
            item.classList.toggle('is-current', picker && item === current);
            if (thumb) {
                const caption = item.querySelector('.kovpack-pdp__video-caption')?.textContent.trim() ?? '';
                item.setAttribute('role', 'button');
                item.tabIndex = 0;
                item.setAttribute('aria-label', text.play.replace('%s', caption));
            } else {
                item.removeAttribute('role');
                item.removeAttribute('tabindex');
                item.removeAttribute('aria-label');
            }
            // A playing clip that leaves the player stops.
            if (thumb) item.querySelectorAll('video').forEach((video) => video.pause());
        }
    };
    const choose = (item) => {
        if (!phone.matches || item === current) return;
        const swap = () => {
            current = item;
            // The player is the first cell of the grid, so it stays on top.
            list.prepend(item);
            render();
        };
        if (document.startViewTransition && !reduced.matches) document.startViewTransition(swap);
        else swap();
    };
    for (const item of items) {
        item.addEventListener('click', (event) => {
            if (item === current || !phone.matches) return;
            event.preventDefault();
            choose(item);
        });
        item.addEventListener('keydown', (event) => {
            if (item === current || (event.key !== 'Enter' && event.key !== ' ')) return;
            event.preventDefault();
            choose(item);
            item.focus({ preventScroll: true });
        });
    }
    phone.addEventListener('change', render);
    render();
}

// 3. Enquiry bar.
const product = document.querySelector('.kovpack-pdp');
const start = product?.querySelector('.kovpack-pdp__actions .button[href^="#"]');
const form = start && document.querySelector(start.getAttribute('href'));
if (product && start && form && 'IntersectionObserver' in window) {
    const bar = document.createElement('div');
    bar.className = 'kovpack-pdp-bar';
    const label = document.createElement('div');
    label.className = 'kovpack-pdp-bar__text';
    label.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.className = 'kovpack-pdp-bar__name';
    const type = document.createElement('span');
    type.className = 'kovpack-pdp-bar__type';
    type.textContent = product.querySelector('.kovpack-pdp__type')?.textContent.trim() ?? '';
    // EN pages carry no subtitle (the product names are English already).
    label.append(name);
    if (type.textContent) label.append(type);
    const link = document.createElement('a');
    link.className = 'kovpack-pdp-bar__button';
    link.href = start.getAttribute('href');
    link.textContent = start.textContent.trim();
    bar.append(label, link);
    // The bar sits outside the product section: take its label colour along.
    const colour = getComputedStyle(product).getPropertyValue('--pdp-label').trim();
    if (colour) bar.style.setProperty('--pdp-label', colour);
    document.body.append(bar);

    let startVisible = true;
    let formVisible = false;
    const render = () => {
        // The product name may be rewritten by product-shelf.js after load.
        name.textContent = product.querySelector('.kovpack-pdp__title')?.textContent.trim() ?? '';
        const show = phone.matches && !startVisible && !formVisible;
        bar.classList.toggle('is-visible', show);
        bar.inert = !show;
        document.body.classList.toggle('has-pdp-bar', show);
    };
    new IntersectionObserver((entries) => {
        // Hidden while the top button is on screen or still below it.
        for (const entry of entries) startVisible = entry.isIntersecting || entry.boundingClientRect.top > 0;
        render();
    }).observe(start);
    const inView = new Set();
    const watch = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) inView.add(entry.target);
            else inView.delete(entry.target);
        }
        formVisible = inView.size > 0;
        render();
    }, { rootMargin: '0px 0px -12% 0px' });
    watch.observe(form);
    if (form.nextElementSibling?.matches('.kovpack-offer')) watch.observe(form.nextElementSibling);
    phone.addEventListener('change', render);
    render();
}

})();
