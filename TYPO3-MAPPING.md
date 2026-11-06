# Design-to-TYPO3 contract

The static website in this repository is the visual reference during design work.
Integrate the approved design into the existing `site_kovpack` site package later;
preserve the existing TYPO3 installation and editor data. Integration requires work
and verification: copying this directory into the CMS does not create editable blocks.

Current design review covers desktop visuals only. Defer mobile-specific design
work and verification until the owner approves the desktop design or explicitly
requests mobile work. Preserve existing responsive behaviour during shared changes.
The phone checks in the final integration checklist remain required before CMS acceptance.

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
| Page shell, header, menu, language switch | Page titles/tree/order, translated links, logo | Keep shared Fluid layout/partials; derive navigation from the actual page tree. The home page header lies over the hero with the large logo; every other page gets one slim sticky bar (72px, logo and menu centred on one line): dark in the footer colour at the top, crossfading to the light glass bar once the page scrolls and back at the top, without changing size |
| Homepage hero | Heading, subline, CTA label/target, repeatable slide images and alt text | Preserve slideshow timing/transitions, controls, responsive crop and reduced motion |
| Products overview intro | Heading, subline, image, alt text | Preserve the split layout, entrance and mobile stacking |
| Roll product cards | Title, short description, square photo/alt, roll appearance, repeatable specs, detail-page link | Sheets are a summary: render only the first 3 spec records (editor order); keep hover/tap/keyboard/Escape and the sheet animation; photo column optional |
| Shelf product view and view switch | Same product record: name, short text, photo (taped print left of the text), first 3 specs, link; per product block a display setting (`data-product-view`: `rolls`, `shelf` or empty) | Reuse the product model. A set display shows only that view and no switch (homepage: `shelf`, products page: `rolls`); empty keeps the visitor's Rollen/Regal switch. Label colour comes from the roll appearance. Closed shelf cards take a share of the row (max 300px); the open sheet lays out by its own width (container query): the print shows from 640px of sheet, text never breaks inside words |
| Product-name capitalization switch | Product base name/translation | Offer the three shared casing previews (`PROTECT Paper`, `PROTECT PAPER`, `Protect Paper` pattern), persist the visitor choice locally and apply it to roll, shelf and product-detail headings without duplicating product records |
| Paper look and font switches (design preview) | None: design choice under review | Preview switches next to the name switch set `data-display-font` (`archivo` default, `shoulders`, `saira`, `barlow`: face of names and section headings, restored on every page by scroll.js), `data-paper-style` (`calm`, `waves`, `curl`), `data-paper-cut` (`serrated`, `torn`, `clean`) and, for the shelf view on desktop, `data-shelf-label` (`below`, `above`: product name under or over the roll) on `<html>`, kept per visitor. Closed shelf cards centre roll and name; on hover the roll glides left. They only swap custom properties of the roll and shelf sheets (product-roll.css). Once the owner picks one look, keep it as the default and drop the switches; do not ship them as an editor field |
| Product detail page (`.kovpack-pdp`) | Same product record: name, full description, photo/alt, all spec records, enquiry link target; repeatable product videos (file or embed, caption, poster/alt, poster focal point and optional zoom) | One page per product under the compact inner-page header; the product colour modifier (`kovpack-pdp--orange|teal|blue`, from the roll appearance) also colours the eyebrow mark and the enquiry button (dark ink text, slightly deeper on hover); breadcrumb to the product overview; all specs in editor order; an empty spec value renders the translated "auf Anfrage" / "on request" with `kovpack-pdp__spec-request` (muted, regular weight); lead text capped at 62ch; tolerate missing photo and any spec count. Photo stack (`[data-pdp-gallery]`, `pdp-gallery.js`): the product photo plus repeatable gallery images (file, alt) render as `.kovpack-pdp__card` prints in `.kovpack-pdp__deck`; any count, editor order; first image eager, the rest lazy; all cropped square. With two or more, the script adds `.is-ready`, unhides `.kovpack-pdp__gallery-nav` (translated prev/next labels, "1 von 4" / "1 of 4" counter) and flips the stack: next slides the top print out and tucks it under, back pulls the bottom print on top; also tap on the top print, swipe and arrow keys. Discoverability: the first time the stack is 60% in view the top print lifts aside once (about 1.5 s) to show the next photo, never again after a flip; on mouse hover the top print lifts and the next fans out. Reduced motion: opacity cross-fade. With one image no stack or controls show. Neither hint runs under reduced motion. "Product videos" section below: 16:9 slots in a 3/2/1-column grid. Until a clip is attached, use `.kovpack-pdp__video-frame--preview` with a lazy-loaded `.kovpack-pdp__video-poster`, a decorative play mark and a translated "Video coming soon" label (no button, link or playback). Posters may reuse the product photo with editorial crops (`--poster-focus`, `--poster-zoom`); keep the warm neutral fallback if no poster is set. When attaching a real clip, replace the preview contents with native video controls or an accessible embed and remove the preview modifier/overlay. Hide the section when there are no records |
| Product applications strip (`.kovpack-pdp__uses`) | Heading, short lead; repeatable application records: icon key, title, short text | Sits between the product layout and the videos. Tiles in an auto-fit grid (any count, wraps); each tile spans three subgrid rows (icon, title, text) so titles and texts line up across a row; icon, title and text are centred on one axis (title up to 24ch, text up to 30ch). Between 901 and 1279px five or more tiles use three columns, so no tile is left alone in a row. Keep titles short enough for one line at desktop width, or the whole row reserves two. Icons are own drawings in `Icons/pdp-uses.svg` (PROTECT: `#use-painting`, `#use-plaster`, `#use-stairs`, `#use-floor`, `#use-fitting`, `#use-moving`; PACKING: `#pk-wrap`, `#pk-line`, `#pk-interleave`, `#pk-pallet`; FILL: `#fill-void`, `#fill-fragile`, `#fill-parcel`, `#fill-block`), referenced with `<svg><use href>`; each symbol viewBox is cropped to its drawing so all icons share one size and bottom line (keep that when adding icons); the paper sheet in each icon takes the product label colour via `--use-accent`. Offer the icon key as a select field; new icons go into the same sprite. Hide the section when there are no records. Below the tiles an optional "Properties" row: repeatable records (icon key `#trait-weight`, `#trait-tape`, `#trait-cut`, `#trait-paper`, `#trait-roll`, `#trait-format`, title, short text) in an auto-fit strip between an ink rule and a light rule, records separated by thin column rules (stacked with dashed dividers at 900px and below), icon and text top-aligned so titles share a line; hide its subheading when empty |
| News cards/scroller | Repeatable translated title, date, text, image/alt, link | Preserve scrolling and empty/single/many item states; connect the approved CMS news model |
| Contact and forms | Contact text/links, labels, fields, consent and response text | Reuse supported TYPO3 form editing; configure actual sending and error handling separately |
| Footer/certification images | Editable footer blocks, links, images/alt and captions | Keep inherited footer editing; do not turn demo claims into approved production claims |
| Pressable buttons | None: styling only | Solid content buttons (`.button` in the page content, form submit) look like a raised key: darker bottom edge derived from `--press-face` or the button colour, soft 1px lift and slightly deeper colour on hover, pushed down on click. The hero call to action keeps its gradient but gets the same press. Header menu and text buttons stay flat. No motion with reduced motion |
| Sticky header/back to top | Page content remains editor-driven | Preserve sticky/spacer logic, smooth return, keyboard and reduced-motion behaviour |
| Other/new pages | Shared blocks plus page-specific editable fields | Record new block contracts here; do not bake whole pages into uneditable HTML blobs |

## Page addresses (URL slugs)

The preview file names are historical. Two of them no longer describe the product.
Do not copy them into the CMS. In the TYPO3 page tree, give each product page the
slug below. Each slug is the main search term for that product in its language,
so search engines and link previews show what the page is about.

| Product | Preview file (do not reuse) | TYPO3 slug DE | TYPO3 slug EN |
| --- | --- | --- | --- |
| PROTECT Paper (surface protection, ca. 180 g/m²) | `de/produkte/bodenschutzpapier`, `en/products/floor-protection-paper` | `/produkte/bodenschutzpapier` | `/en/products/floor-protection-paper` |
| PACKING Paper (wrapping, lining, interleaving) | `de/produkte/lackier-abdeckpapier`, `en/products/masking-paper` (wrong: masking paper) | `/produkte/packpapier` | `/en/products/packing-paper` |
| FILL Paper (void fill, cushioning, blocking) | `de/produkte/verpackungs-polsterpapier`, `en/products/packaging-paper` (too general) | `/produkte/polsterpapier` | `/en/products/void-fill-paper` |

Rules:
- Lowercase, hyphens only, umlauts transliterated (`ä` → `ae`, `ß` → `ss`).
- The DE and EN pages of one product are linked as translations, so the language switch and `hreflang` find each other.
- Set the page title and meta description with the same search term as the slug.
- If an address has already been public on the live site, add a 301 redirect from the old address before changing it.

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
