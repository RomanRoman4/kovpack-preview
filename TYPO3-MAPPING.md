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
| Page shell, header, menu, language switch | Page titles/tree/order, translated links, logo | Keep shared Fluid layout/partials; derive navigation from the actual page tree |
| Homepage hero | Heading, subline, CTA label/target, repeatable slide images and alt text | Preserve slideshow timing/transitions, controls, responsive crop and reduced motion |
| Products overview intro | Heading, subline, image, alt text | Preserve the split layout, entrance and mobile stacking |
| Roll product cards | Title, description, photo/alt, roll appearance, repeatable specs, CTA | Keep hover/tap/keyboard/Escape and the sheet animation; support varying card/spec counts |
| Shelf product view and view switch | Same product content, appearance choice where required | Reuse the product model; preserve roll/shelf switching and touch behaviour |
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
