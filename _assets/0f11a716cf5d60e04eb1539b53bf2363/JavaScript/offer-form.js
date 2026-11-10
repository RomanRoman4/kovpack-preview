/* Product enquiry form (owner, 2026-11-09): keeps the "Ihre Anfrage" summary
 * beside the form in step with the choices, shows the custom width / cut-size
 * field only when "Sonderbreite" / "Zuschnitt nach Maß" is chosen. The phone number is
 * always required (owner, 2026-11-10). Orders ship on pallets only; the form
 * estimates rolls per pallet from grammage, width and roll length (owner,
 * 2026-11-10). Without script the form still works: every field is a plain
 * form field. */
(function () {
    'use strict';

    /* Rough rolls per pallet, a guide value until a test pallet per format
     * is built. Calibrated on competitors' published rolls and diameters
     * (research 2026-11-10): wound kraft of about 0.6 g/cm³ on a core of
     * 50 mm inside with a 2 mm wall, so 54 mm outside (owner, 2026-11-10),
     * a Euro pallet (1200 × 800 mm) loaded up to 1650 mm (1.80 m with the
     * pallet), at most 1000 kg. Rolls stand on end;
     * short wide rolls (PROTECT, data-offer-lying) may also lie, whichever
     * fits more. */
    var PALLET = { length: 1200, width: 800, height: 1650, load: 1000, core: 54, density: 0.6, gap: 1.03 };

    function rollKg(grammage, widthCm, lengthM) {
        return grammage * widthCm / 100 * lengthM / 1000;
    }

    function rollsPerPallet(grammage, widthCm, lengthM, lying) {
        if (!grammage || !widthCm || !lengthM) return 0;
        var thickness = grammage / (PALLET.density * 1000);
        var diameter = Math.sqrt(4 * lengthM * 1000 * thickness / Math.PI + PALLET.core * PALLET.core) * PALLET.gap;
        var rollWidth = widthCm * 10;
        var standing = Math.floor(PALLET.length / diameter) * Math.floor(PALLET.width / diameter) * Math.max(1, Math.floor(PALLET.height / rollWidth));
        var lyingCount = lying && rollWidth <= PALLET.length
            ? Math.floor(PALLET.length / rollWidth) * Math.floor(PALLET.width / diameter) * Math.floor(PALLET.height / diameter)
            : 0;
        return Math.min(Math.max(standing, lyingCount), Math.floor(PALLET.load / rollKg(grammage, widthCm, lengthM)));
    }

    /* Delivery place: suggests "PLZ Ort" while typing a postcode or a town
     * and completes the town once a postcode with one town is typed (owner,
     * 2026-11-10). The list (GeoNames postal codes DE, CC BY 4.0, delivery
     * codes only, ~90 KB gzipped) is a local file loaded the first time the
     * field gets focus, so nothing is sent to a third party and the page
     * itself does not get heavier. */
    var MAX_SUGGESTIONS = 12;

    function decodePlaces(data) {
        var byCode = {};
        var codes = [];
        var code = 0;
        data.p.split(',').forEach(function (row) {
            var parts = row.split(':');
            code += parseInt(parts[0], 10);
            var plz = String(code).padStart(5, '0');
            byCode[plz] = parts[1].split('.').map(function (index) { return data.n[parseInt(index, 16)]; });
            codes.push(plz);
        });
        return { byCode: byCode, codes: codes };
    }

    function setupPlaceLookup(field) {
        var places = null;
        var loading = false;
        var list = document.createElement('datalist');
        list.id = field.id + '-suggestions';
        field.after(list);
        field.setAttribute('list', list.id);
        field.setAttribute('autocomplete', 'off');

        function load() {
            if (places || loading) return;
            loading = true;
            fetch(field.dataset.offerPlz)
                .then(function (response) { return response.ok ? response.json() : Promise.reject(response.status); })
                .then(function (data) { places = decodePlaces(data); suggest(); })
                .catch(function () { /* no suggestions; the field still works as plain text */ })
                .then(function () { loading = false; });
        }

        function suggest() {
            if (!places) return;
            var value = field.value.trim();
            var match = /^(\d{2,5})\s*(.*)$/.exec(value);
            var found = [];
            if (match) {
                var town = match[2].toLowerCase();
                for (var i = 0; i < places.codes.length && found.length < MAX_SUGGESTIONS; i++) {
                    var plz = places.codes[i];
                    if (plz.indexOf(match[1]) !== 0) continue;
                    places.byCode[plz].forEach(function (name) {
                        if (found.length < MAX_SUGGESTIONS && name.toLowerCase().indexOf(town) === 0) found.push(plz + ' ' + name);
                    });
                }
            } else if (/^\D{2,}/.test(value)) {
                var query = value.toLowerCase();
                for (var j = 0; j < places.codes.length && found.length < MAX_SUGGESTIONS; j++) {
                    var code = places.codes[j];
                    places.byCode[code].forEach(function (name) {
                        if (found.length < MAX_SUGGESTIONS && name.toLowerCase().indexOf(query) === 0) found.push(code + ' ' + name);
                    });
                }
            }
            list.replaceChildren.apply(list, found.map(function (text) {
                var option = document.createElement('option');
                option.value = text;
                return option;
            }));
        }

        field.addEventListener('focus', load);
        field.addEventListener('input', function (event) {
            load();
            /* A full postcode with exactly one town gets its town right away. */
            var deleting = event.inputType && event.inputType.indexOf('delete') === 0;
            var value = field.value.trim();
            if (places && !deleting && /^\d{5}$/.test(value) && places.byCode[value] && places.byCode[value].length === 1) {
                field.value = value + ' ' + places.byCode[value][0];
            }
            suggest();
        });
    }

    function labelOf(input) {
        var span = input.closest('label') && input.closest('label').querySelector('span');
        return span ? span.textContent.trim() : input.value;
    }

    function setup(form) {
        var summary = document.querySelector('[data-offer-summary="' + form.id + '"]');
        var empty = form.dataset.offerEmpty || '—';
        var words = {
            rolls: form.dataset.offerRolls || 'Rollen',
            pallet: form.dataset.offerPallet || 'Palette',
            pallets: form.dataset.offerPallets || 'Paletten',
            per: form.dataset.offerPer || 'pro Palette',
            total: form.dataset.offerTotal || 'gesamt',
            open: form.dataset.offerOpen || ''
        };
        var fixedWidth = parseInt(form.dataset.offerWidth, 10) || 0;
        var lying = 'offerLying' in form.dataset;
        /* PACKING: the roll length follows the grammage, so a roll of one
         * width always weighs the same (market practice). */
        var lengths = {};
        try { lengths = JSON.parse(form.dataset.offerLengths || '{}'); } catch (error) { lengths = {}; }
        var lengthField = form.querySelector('[data-offer-length]');
        var lengthOut = form.querySelector('[data-offer-length-out]');
        var locale = document.documentElement.lang || 'de';
        var perRoll = locale === 'de' ? ['je Rolle ca. ', ' kg'] : ['approx. ', ' kg per roll'];
        var palletHint = form.querySelector('[data-offer-out="pallet"]');
        var unitWord = form.querySelector('[data-offer-unit]');
        var quantity = form.querySelector('input[type="number"]');
        var date = form.querySelector('[data-offer-date]');

        if (date) date.min = new Date().toISOString().slice(0, 10);
        var placeField = form.querySelector('[data-offer-plz]');
        if (placeField && window.fetch) setupPlaceLookup(placeField);

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
            /* Choice groups of the product (grammage, width, format, length). */
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

            /* Quantity in pallets, with the estimated rolls. A custom width
             * or cut size has no estimate: that is agreed with the customer. */
            var amount = Math.max(0, parseInt(quantity && quantity.value, 10) || 0);
            var grammage = radio('grammage');
            var width = radio('width');
            var length = radio('length');
            var format = radio('format');
            var grammageValue = grammage ? parseInt(grammage.value, 10) : 0;
            var lengthValue = length ? parseInt(length.value, 10) : 0;
            if (lengthField && grammage && lengths[grammage.value]) {
                lengthValue = lengths[grammage.value];
                lengthField.value = String(lengthValue);
                if (lengthOut) lengthOut.textContent = lengthValue + ' m';
                out('length', lengthValue + ' m');
            }
            var widthValue = width ? parseInt(width.value, 10) : fixedWidth;
            var custom = (width && width.value === 'custom') || (format && format.value === 'custom');
            var perPallet = custom ? 0 : rollsPerPallet(grammageValue, widthValue, lengthValue, lying);
            var palletWord = amount === 1 ? words.pallet : words.pallets;
            if (unitWord) unitWord.textContent = palletWord;
            var frequency = radio('frequency');
            var quantityText = amount ? amount + ' ' + palletWord : '';
            if (amount && perPallet) quantityText += ' (≈ ' + amount * perPallet + ' ' + words.rolls + ')';
            if (quantityText && frequency) quantityText += ', ' + labelOf(frequency);
            out('quantity', quantityText);
            if (palletHint) {
                palletHint.textContent = '';
                if (perPallet) {
                    var count = document.createElement('strong');
                    count.textContent = '≈ ' + perPallet + ' ' + words.rolls;
                    palletHint.append(count, ' ' + words.per);
                    if (amount > 1) palletHint.append(', ' + words.total + ' ≈ ' + amount * perPallet + ' ' + words.rolls);
                    var kg = rollKg(grammageValue, widthValue, lengthValue);
                    palletHint.append(' · ' + perRoll[0] + kg.toLocaleString(locale, { maximumFractionDigits: 1 }) + perRoll[1]);
                } else {
                    palletHint.textContent = words.open;
                }
            }

            /* Delivery place and date. */
            var place = form.querySelector('[name$="[place]"]');
            var when = date && date.value ? new Date(date.value + 'T00:00').toLocaleDateString(document.documentElement.lang || 'de') : '';
            out('delivery', [place && place.value.trim(), when].filter(Boolean).join(', '));

            /* Sample and advice wanted. */
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
