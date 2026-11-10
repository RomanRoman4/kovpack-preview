/* Product enquiry form (owner, 2026-11-09): keeps the "Ihre Anfrage" summary
 * beside the form in step with the choices, converts pallets to rolls when the
 * product record knows rolls per pallet, shows the custom width / cut-size
 * field only when "Sonderbreite" / "Zuschnitt nach Maß" is chosen. The phone number is
 * always required (owner, 2026-11-10). Without script the form still works:
 * every field is a plain form field. */
(function () {
    'use strict';

    function labelOf(input) {
        var span = input.closest('label') && input.closest('label').querySelector('span');
        return span ? span.textContent.trim() : input.value;
    }

    function setup(form) {
        var summary = document.querySelector('[data-offer-summary="' + form.id + '"]');
        var empty = form.dataset.offerEmpty || '—';
        var perPallet = parseInt(form.dataset.offerPerPallet, 10) || 0;
        var rollsWord = form.dataset.offerRolls || 'Rollen';
        var palletsWord = form.dataset.offerPallets || 'Paletten';
        var palletHint = form.querySelector('[data-offer-out="pallet"]');
        var palletHintBase = palletHint ? palletHint.textContent : '';
        var quantity = form.querySelector('input[type="number"]');
        var date = form.querySelector('[data-offer-date]');

        if (date) date.min = new Date().toISOString().slice(0, 10);

        function out(name, text) {
            if (!summary) return;
            var target = summary.querySelector('[data-offer-out="' + name + '"]');
            if (!target) return;
            target.textContent = text || empty;
            target.classList.toggle('is-empty', !text);
        }

        function radio(key) {
            return form.querySelector('input[type="radio"][name$="[' + key + ']"]:checked');
        }

        function update() {
            /* Choice groups of the product (grammage, width, plies, format). */
            Array.prototype.forEach.call(form.querySelectorAll('.kovpack-offer__step:first-of-type input[type="radio"]:checked'), function (input) {
                var key = input.name.replace(/^.*\[([^\]]+)\]$/, '$1');
                var text = labelOf(input);
                var reveal = form.querySelector('[data-offer-reveal="' + key + '"]');
                if (reveal) {
                    var custom = input.value === 'custom';
                    reveal.hidden = !custom;
                    var field = reveal.querySelector('input');
                    if (field) {
                        field.required = custom;
                        if (custom && field.value.trim()) text = field.value.trim();
                    }
                }
                out(key, text);
            });

            /* Quantity, unit and pallet conversion. */
            var amount = Math.max(0, parseInt(quantity && quantity.value, 10) || 0);
            var unit = radio('unit');
            var pallets = unit && unit.value === 'pallets';
            var frequency = radio('frequency');
            var quantityText = amount ? amount + ' ' + (pallets ? palletsWord : rollsWord) : '';
            if (amount && pallets && perPallet) quantityText += ' (' + amount * perPallet + ' ' + rollsWord + ')';
            if (quantityText && frequency) quantityText += ', ' + labelOf(frequency);
            out('quantity', quantityText);
            if (palletHint) {
                palletHint.textContent = amount && pallets && perPallet
                    ? palletHintBase + ' · ' + amount + ' × ' + perPallet + ' = ' + amount * perPallet + ' ' + rollsWord
                    : palletHintBase;
            }

            /* Delivery place and date. */
            var place = form.querySelector('[name$="[place]"]');
            var when = date && date.value ? new Date(date.value + 'T00:00').toLocaleDateString(document.documentElement.lang || 'de') : '';
            out('delivery', [place && place.value.trim(), when].filter(Boolean).join(', '));

            /* Sample and call back. */
            var extras = Array.prototype.map.call(form.querySelectorAll('[data-offer-extra]:checked'), labelOf);
            var extrasRow = summary && summary.querySelector('[data-offer-row="extras"]');
            if (extrasRow) extrasRow.hidden = !extras.length;
            out('extras', extras.join(', '));
        }

        form.addEventListener('input', update);
        form.addEventListener('change', update);

        /* − / + beside the quantity (pointer convenience; the field itself
         * stays the keyboard control, so the buttons are out of tab order). */
        Array.prototype.forEach.call(form.querySelectorAll('[data-offer-step]'), function (button) {
            button.addEventListener('click', function () {
                if (!quantity) return;
                var next = (parseInt(quantity.value, 10) || 0) + parseInt(button.dataset.offerStep, 10);
                quantity.value = String(Math.max(1, next));
                update();
            });
        });

        update();
    }

    function init() {
        Array.prototype.forEach.call(document.querySelectorAll('[data-offer-form]'), setup);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
}());
