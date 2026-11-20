// Recycling seal on the product cards and detail pages (owner, 2026-11-20):
// no preview switches any more. The seal is always in the brand colour and,
// on the unrolled sheets, sits at the top right beside the intro.
(() => {
    const root = document.documentElement;
    root.dataset.ecoTone = 'brand';
    try {
        window.localStorage.removeItem('kovpack-eco-tone');
        window.localStorage.removeItem('kovpack-eco-position');
    } catch { /* private mode */ }

    for (const seal of document.querySelectorAll('.kovpack-roll__seal')) {
        const content = seal.closest('.kovpack-roll__sheet-content');
        if (content && seal.closest('.kovpack-roll__footer')) content.prepend(seal);
    }
})();
