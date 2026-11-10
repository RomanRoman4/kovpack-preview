#!/usr/bin/env node
/* Cache busting for the GitHub Pages preview.
 *
 * GitHub Pages serves every file with "Cache-Control: max-age=600", so after a
 * plain reload a browser may still use cached CSS, JS and images. This script
 * appends "?v=<content hash>" to every local asset URL in the pages and
 * stylesheets. The stamp changes only when the file itself changes, so a normal
 * reload picks up each new design change and nothing else is downloaded again.
 *
 * Run it before every commit:  node tools/stamp-assets.mjs
 * It is idempotent: existing ?v= stamps are replaced, unchanged files keep theirs.
 * Preview only; TYPO3 adds its own cache busting to generated asset URLs. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const ASSET = /((?:\.\.\/|\.\/)*(?:_assets|fileadmin|typo3temp|Images|Fonts)\/[^"'\s,()?#]+\.(?:css|json|js|webp|avif|png|jpe?g|gif|svg|mp4|webm|woff2?))(\?v=[0-9a-f]+)?/g;
const hashes = new Map();

function hashOf(file) {
    if (!hashes.has(file)) {
        let data = fs.existsSync(file) ? fs.readFileSync(file) : null;
        /* Text files hash without CR so Windows and Unix checkouts agree. */
        if (data && /\.(css|js|svg)$/.test(file)) data = data.toString('utf8').replace(/\r/g, '');
        hashes.set(file, data ? crypto.createHash('md5').update(data).digest('hex').slice(0, 8) : null);
    }
    return hashes.get(file);
}

function stamp(file) {
    const dir = path.dirname(file);
    const before = fs.readFileSync(file, 'utf8');
    let missing = 0;
    const after = before.replace(ASSET, (match, url) => {
        const h = hashOf(path.resolve(dir, decodeURI(url)));
        if (!h) { missing++; return match; }
        return `${url}?v=${h}`;
    });
    if (after !== before) fs.writeFileSync(file, after);
    if (missing) console.warn(`${path.relative(root, file)}: ${missing} asset URL(s) point to missing files`);
    return after !== before;
}

function walk(dir, ext, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'tools') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, ext, out);
        else if (entry.name.endsWith(ext)) out.push(full);
    }
    return out;
}

/* Stylesheets first: stamping their url() references changes their own hash,
 * which the pages then pick up. */
let changed = 0;
for (const css of walk(root, '.css')) if (stamp(css)) changed++;
hashes.clear();
for (const html of walk(root, '.html')) if (stamp(html)) changed++;
console.log(`stamp-assets: ${changed} file(s) updated`);
