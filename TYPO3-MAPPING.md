# Design-to-TYPO3 contract

The static website in this repository is the visual reference during design work.
Integrate the approved design into the existing `site_kovpack` site package later;
preserve the existing TYPO3 installation and editor data. Integration requires work
and verification: copying this directory into the CMS does not create editable blocks.

## Current files

- `de/` and `en/`: page markup and relative navigation for both languages.
- `_assets/0f11a716cf5d60e04eb1539b53bf2363/`: current project CSS, JavaScript and assets.
- `_assets/f7dfe1dd89fe6a2f36813ded2dc54cd9/`: exported Camino foundation and fonts.
- `fileadmin/_processed_/` and `typo3temp/assets/`: exported visible images/generated CSS.
- The exported directory hashes are a baseline detail, not a future TYPO3 asset API.
  In CMS templates use extension/FAL asset helpers, not literal exported hash URLs.
- `preview.json` describes the starting export only; it is not a CMS database or a
  live statement that the later standalone design matches the old source commit.

## Component and field map

| Component | Editor-controlled content | Migration/behaviour contract |
| --- | --- | --- |
| Layout grid (all pages) | None: layout only | Header, every section and the footer share one pair of page edges: `--kovpack-container` (max content width, 1600px) and `--kovpack-inset` (min side space, 48px / 20px on phones) give `--kovpack-edge`. Full-width wrappers pad by `--kovpack-edge`; `.page__content` is a grid of edge + 12 columns + edge (`full` / `content` lines). New blocks must use these lines, not their own side paddings or margins |
| Page shell, header, menu, language switch | Page titles/tree/order, translated links, logo | Keep shared Fluid layout/partials; derive navigation from the actual page tree |
| Homepage hero | Heading, subline, CTA label/target, repeatable slide images and alt text | Preserve slideshow timing/transitions, controls, responsive crop and reduced motion |
| Products overview intro | Heading, subline, image, alt text | Preserve the split layout, entrance and mobile stacking |
| Roll product cards | Title, short description, square photo/alt, roll appearance, repeatable specs, detail-page link | Sheets are a summary: render only the first 3 spec records (editor order); keep hover/tap/keyboard/Escape and the sheet animation; photo column optional |
| Shelf product view and view switch | Same product record: name, short text, photo (taped print left of the text), first 3 specs, link; per product block a display setting (`data-product-view`: `rolls`, `shelf` or empty) | Reuse the product model. A set display shows only that view and no switch (homepage: `shelf`, products page: `rolls`); empty keeps the visitor's Rollen/Regal switch. Label colour comes from the roll appearance. Closed shelf cards take a share of the row (max 300px); the open sheet lays out by its own width (container query): the print shows from 640px of sheet, text never breaks inside words |
| Product-name capitalization switch | Product base name/translation | Offer the three shared casing previews (`PROTECT Paper`, `PROTECT PAPER`, `Protect Paper` pattern), persist the visitor choice locally and apply it to roll, shelf and product-detail headings without duplicating product records |
| Paper look switches (design preview) | None: design choice under review | Preview switches next to the name switch set `data-paper-style` (`calm`, `waves`, `curl`), `data-paper-cut` (`serrated`, `torn`, `clean`) and, for the shelf view on desktop, `data-shelf-label` (`below`, `above`: product name under or over the roll) on `<html>`, kept per visitor. Closed shelf cards centre roll and name; on hover the roll glides left. They only swap custom properties of the roll and shelf sheets (product-roll.css). Once the owner picks one look, keep it as the default and drop the switches; do not ship them as an editor field |
| Product detail page (`.kovpack-pdp`) | Same product record: name, full description, photo/alt, all spec records, enquiry link target | One page per product; breadcrumb to the product overview; all specs in editor order; tolerate missing photo and any spec count |
| News cards/scroller | Repeatable translated title, date, text, image/alt, link | Preserve scrolling and empty/single/many item states; connect the approved CMS news model |
| Contact and forms | Contact text/links, labels, fields, consent and response text | Reuse supported TYPO3 form editing; configure actual sending and error handling separately |
| Footer/certification images | Editable footer blocks, links, images/alt and captions | Keep inherited footer editing; do not turn demo claims into approved production claims |
| Sticky header/back to top | Page content remains editor-driven | Preserve sticky/spacer logic, smooth return, keyboard and reduced-motion behaviour |
| Other/new pages | Shared blocks plus page-specific editable fields | Record new block contracts here; do not bake whole pages into uneditable HTML blobs |

## Integration procedure

1. Freeze an approved preview Git commit as the reference and collect desktop/phone
   screenshots plus interaction expectations for all page types in both languages.
2. Read the existing private project's AGENTS.md, SITE_STRUCTURE.md and architecture.
   Reuse its Camino foundation, page tree and data where compatible; never edit vendor code.
3. Split static HTML into shared Fluid page layouts/partials and editable content blocks.
   Map content to fields/records, respecting localization and repeatable lists. Prefer
   existing supported fields/blocks; extend only for an actual design requirement.
4. Move project CSS/JS/fonts/design assets into `site_kovpack/Resources/Public` and wire
   them through TYPO3 helpers. Import editorial pictures through FAL. Preserve useful
   originals/quality/crops; do not assume exported thumbnails are the master media files.
5. Replace hardcoded text, image paths, navigation and demo form handlers with CMS data
   and supported functionality while keeping the agreed DOM/classes/data attributes where possible.
6. Compare the rendered CMS pages against the approved static reference. Fix differences
   before restoring any automated export. Do not overwrite this design reference with CMS output.

## Acceptance before declaring integration complete

- DE/EN page tree, links, shared layout, fonts, photos/crops and visible styling match.
- Desktop/phone widths, small screens and overflow checks pass.
- Hero, roll/shelf cards, menus, scrollers, sticky header and back-to-top behave equally.
- Keyboard, touch, focus and reduced-motion behaviour pass.
- In the TYPO3 backend, edit real titles/text/photos/alt text/links and reorder/add/remove
  blocks/items. Verify the frontend after saving, including long/empty content and missing images.
- Forms work through the configured CMS flow; do not mistake the static visual demo for delivery.
- Record actual remaining differences. Do not promise exact equivalence before these checks pass.
