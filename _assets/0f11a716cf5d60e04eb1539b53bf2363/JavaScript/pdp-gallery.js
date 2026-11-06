/* Product photo stack: "next" slides the top print out and tucks it under the
 * stack, "back" pulls the bottom print out and lays it on top. Works for any
 * number of [data-pdp-gallery-card] items; with one card nothing is set up. */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var canAnimate = typeof Element.prototype.animate === 'function';
    var DURATION = 820;

    function setup(gallery) {
        var deck = gallery.querySelector('.kovpack-pdp__deck');
        var cards = Array.prototype.slice.call(gallery.querySelectorAll('[data-pdp-gallery-card]'));
        var nav = gallery.querySelector('.kovpack-pdp__gallery-nav');
        var current = gallery.querySelector('[data-pdp-gallery-current]');
        var total = gallery.querySelector('[data-pdp-gallery-total]');
        if (!deck || cards.length < 2) return;

        var order = cards.map(function (_, i) { return i; });
        var running = null;

        function layout() {
            order.forEach(function (cardIndex, depth) {
                var card = cards[cardIndex];
                card.setAttribute('data-depth', String(Math.min(depth, 3)));
                card.style.zIndex = String(cards.length - depth);
                card.setAttribute('aria-hidden', depth === 0 ? 'false' : 'true');
            });
            if (current) current.textContent = String(order[0] + 1);
        }

        /* Puts a card at its new depth without a CSS transition and returns
         * the resting transform it gets there. */
        function restingTransform(card) {
            card.classList.add('is-moving');
            return getComputedStyle(card).transform;
        }

        function fly(card, from, to, tuckUnder) {
            var outFrom = tuckUnder ? from : to;
            var out = outFrom + ' translate(58%, -5%) rotate(7deg)';
            var top = cards.length + 1;
            var keyframes = tuckUnder ? [
                { transform: from, zIndex: top, easing: 'cubic-bezier(.2, 0, 0, 1)' },
                { transform: out, zIndex: top, offset: 0.45 },
                { transform: out, zIndex: 0, offset: 0.45, easing: 'cubic-bezier(.22, .8, .24, 1)' },
                { transform: to, zIndex: 0 }
            ] : [
                { transform: from, zIndex: 0, easing: 'cubic-bezier(.2, 0, 0, 1)' },
                { transform: out, zIndex: 0, offset: 0.45 },
                { transform: out, zIndex: top, offset: 0.45, easing: 'cubic-bezier(.22, .8, .24, 1)' },
                { transform: to, zIndex: top }
            ];
            var animation = card.animate(keyframes, { duration: DURATION });
            running = animation;
            card.pdpAnimation = animation;
            /* Finish events arrive late; a card that already flies again keeps
             * its class. Its z-index always comes from layout(). */
            animation.onfinish = animation.oncancel = function () {
                if (running === animation) running = null;
                if (card.pdpAnimation !== animation) return;
                card.pdpAnimation = null;
                card.classList.remove('is-moving');
            };
        }

        function fade(card) {
            card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
        }

        function go(step) {
            stopHint();
            if (running) running.finish();
            var plain = reduceMotion.matches || !canAnimate;
            var moving, from;

            if (step > 0) {
                moving = cards[order[0]];
                from = getComputedStyle(moving).transform;
                order.push(order.shift());
            } else {
                moving = cards[order[order.length - 1]];
                from = getComputedStyle(moving).transform;
                order.unshift(order.pop());
            }
            layout();

            if (plain) {
                if (canAnimate) fade(cards[order[0]]);
                return;
            }
            var to = restingTransform(moving);
            fly(moving, from, to, step > 0);
        }

        /* Hint (owner, 2026-11-06): the first time the stack is well in view,
         * the top print lifts aside once so the next photo shows, then settles.
         * It never runs again after the visitor flips, or under reduced motion. */
        var touched = false;
        var hints = [];
        var hintTimer = null;
        function stopHint() {
            touched = true;
            clearTimeout(hintTimer);
            hints.forEach(function (animation) { animation.cancel(); });
            hints = [];
        }
        function nudge(card, shift, duration) {
            var rest = getComputedStyle(card).transform;
            var aside = rest + ' ' + shift;
            return card.animate([
                { transform: rest, easing: 'cubic-bezier(.2, 0, 0, 1)' },
                { transform: aside, offset: 0.34 },
                { transform: aside, offset: 0.52, easing: 'cubic-bezier(.22, .8, .24, 1)' },
                { transform: rest }
            ], { duration: duration });
        }
        function peek() {
            if (touched || reduceMotion.matches || !canAnimate) return;
            touched = true;
            hints = [
                nudge(cards[order[0]], 'translate(20%, -3%) rotate(5deg)', 1500),
                nudge(cards[order[1]], 'translate(-3%, 1%) rotate(-1.5deg)', 1500)
            ];
        }
        if ('IntersectionObserver' in window) {
            var watcher = new IntersectionObserver(function (entries) {
                if (touched) { watcher.disconnect(); return; }
                if (entries[0].isIntersecting) hintTimer = setTimeout(peek, 900);
                else clearTimeout(hintTimer);
            }, { threshold: 0.6 });
            watcher.observe(deck);
        }

        layout();
        gallery.classList.add('is-ready');
        if (total) total.textContent = String(cards.length);
        if (nav) nav.hidden = false;

        var prev = gallery.querySelector('[data-pdp-gallery-prev]');
        var next = gallery.querySelector('[data-pdp-gallery-next]');
        if (prev) prev.addEventListener('click', function () { go(-1); });
        if (next) next.addEventListener('click', function () { go(1); });

        gallery.addEventListener('keydown', function (event) {
            if (event.key === 'ArrowRight') { event.preventDefault(); go(1); }
            if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1); }
        });

        /* A tap on the top print shows the next one; a horizontal swipe flips
         * either way (left = next). */
        var startX = null;
        var startY = null;
        deck.addEventListener('pointerdown', function (event) {
            startX = event.clientX;
            startY = event.clientY;
        });
        deck.addEventListener('pointerup', function (event) {
            if (startX === null) return;
            var dx = event.clientX - startX;
            var dy = event.clientY - startY;
            startX = null;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
                go(dx < 0 ? 1 : -1);
            } else if (Math.abs(dx) < 6 && Math.abs(dy) < 6 && event.target.closest('[data-depth="0"]')) {
                go(1);
            }
        });
        deck.addEventListener('pointercancel', function () { startX = null; });
        deck.addEventListener('dragstart', function (event) { event.preventDefault(); });
    }

    function init() {
        Array.prototype.forEach.call(document.querySelectorAll('[data-pdp-gallery]'), setup);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
}());
