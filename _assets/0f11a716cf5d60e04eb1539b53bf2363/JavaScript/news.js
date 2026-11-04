(() => {
"use strict";
// Native scrolling and all editorial items remain available without JavaScript.
for (const section of document.querySelectorAll('[data-news]')) {
    const track = section.querySelector('[data-news-track]');
    const previous = section.querySelector('[data-news-prev]');
    const next = section.querySelector('[data-news-next]');
    if (!track || !previous || !next) continue;
    const overflowing = () => track.scrollWidth > track.clientWidth + 2;
    const update = () => {
        previous.hidden = next.hidden = track.children.length < 2;
        previous.disabled = overflowing() && track.scrollLeft <= 2;
        next.disabled = overflowing() && track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };
    for (const [button, direction] of [[previous, -1], [next, 1]]) {
        button.addEventListener('click', () => {
            const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (overflowing()) {
                track.scrollBy({ left: direction * track.clientWidth, behavior: reduced ? 'instant' : 'smooth' });
            } else {
                // The reference shows controls even when four cards fit. Rotate
                // the real records instead of generating duplicate focusable cards.
                if (direction > 0) track.append(track.firstElementChild);
                else track.prepend(track.lastElementChild);
                if (!reduced) track.animate([{ opacity: .6, transform: `translateX(${direction * 12}px)` }, { opacity: 1, transform: 'none' }], { duration: 250, easing: 'ease-out' });
            }
            update();
        });
    }
    track.addEventListener('scroll', update, { passive: true });
    new ResizeObserver(update).observe(track);
    update();
}

})();
