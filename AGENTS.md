# KOVPACK design workspace

This repository is the standalone HTML/CSS/JavaScript design source for the manager's
preview. It runs without TYPO3, PHP, a database or DDEV. Keep responses short, practical
and in Russian. Read this file and TYPO3-MAPPING.md; inspect only files relevant to the task.

## Working and publishing

- Work in this checkout, not in the separate TYPO3 project or its generated export folder.
- Before editing, check Git status and fetch/pull the latest `main` with fast-forward only.
  Preserve local work. Stop on a conflict or divergence; never force-push or overwrite history.
- After a completed, verified visible change, automatically create a small English commit
  of the intended preview changes and push `origin main`. This permission applies only to
  `RomanRoman4/kovpack-preview`. Report success/failure; GitHub Pages updates the same URL.
- Source commits, merges and pushes in the separate private TYPO3 repository require an
  explicit owner request. Do not start TYPO3 exports: they would replace this design.
- Preserve the existing Git author. Do not add AI attribution or Co-Authored-By trailers.
- Keep keys, tokens, machine-specific Git settings, private CMS documents and task logs out
  of this repository. Do not recreate the removed offline readme or add a marketing README.
- A fresh clone on another computer needs the developer's own GitHub authentication.
  Local SSH configuration is not part of the repository and must not be copied between PCs.

## Design contract

- Current review scope: desktop visuals only. Defer mobile-specific design work and
  verification until the owner approves the desktop design or explicitly asks for
  mobile work. Preserve the existing responsive behaviour while editing shared code.
- Preserve the current DE/EN pages, responsive layout, product roll/shelf variants, hero
  slideshow, sticky header, back-to-top behaviour, fonts, pictures and animations unless
  the owner asks to change them. Keep `.nojekyll` and project-relative URLs for GitHub Pages.
- Prefer shared CSS/JS and reusable semantic components. Do not introduce a new framework
  or build system without a demonstrated need. Do not duplicate new styling per page.
- All future editorial text, images/alt text, links, lists and block order must be suitable
  for TYPO3 fields and repeatable records. Components must tolerate long/empty content,
  missing/replaced images, translations, reordered items and different item counts.
- Give new interactions stable classes/data attributes; avoid fixed page IDs, generated
  asset hashes, fixed text lengths, exactly three products, or dependencies on a local host.
- Keep keyboard/touch interaction, visible focus and reduced-motion behaviour working.
  Forms are a visual demo until the later CMS integration explicitly connects delivery.
- When adding/changing a component, update its field/interaction contract in TYPO3-MAPPING.md.
  Do not keep a running diary of routine edits.

## Verification

For the current desktop-only review, check the changed page/component in DE and EN
at desktop widths. Resume phone-width checks when the owner approves the desktop
design or explicitly asks for mobile work. Verify its
links, images, fonts and interactions, and check for browser errors and horizontal overflow.
Use focused checks rather than loading the private CMS project's entire test suite.
Before final TYPO3 integration, follow the migration and acceptance checklist in the map.
