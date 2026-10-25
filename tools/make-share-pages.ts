// Run once per text change:  node tools/make-share-pages.ts
import { mkdirSync, writeFileSync } from 'node:fs'
import { siteConfig } from "../src/constants.ts"

const SITE = siteConfig.url

const PRIZES = {
    rock: { title: 'A Rock', share: 'I just won A ROCK from the gacha machine. It has been doing nothing for 400 million years and I respect that deeply.' },
    potato: { title: 'A Potato', share: 'I just won A POTATO from the gacha machine. It is a family heirloom passed down from their great-grandfather. Eh!? Wait, does accepting it mean I am part of the family now? ...Do I have to attend the reunions?' },
    sock: { title: 'A Single Sock', share: 'I just won A SINGLE SOCK from the gacha machine. Its partner is missing and now it has me.' },
    bottlecap: { title: 'A Bottle Cap', share: 'I just won A BOTTLE CAP from the gacha machine. Anyone want to trade it for a full cola?' },
    coffee: { title: 'A Canned Coffee', share: "I just won A CANNED COFFEE from the gacha machine. That's it! Don't ask questions!" },
    rice: { title: 'One (1) Grain Of Rice', share: 'I just won ONE (1) GRAIN OF RICE from the gacha machine. What am I even supposed to do with it!?' },
    teabag: { title: 'A Used Tea Bag', share: 'I just won A USED TEA BAG from the gacha machine. Can I really use it a second time? What about a third? And a fou—' },
    cert: { title: 'Certificate Of NEET', share: 'I just won a CERTIFICATE OF NEET from the gacha machine. After years of unpaid practice, my profession is finally official.' },
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

for (const [id, p] of Object.entries(PRIZES)) {
    const dir = `public/share/${id}`
    mkdirSync(dir, { recursive: true })
    const img = `${SITE}/share/${id}/card.png`
    const head = `I won ${p.title} from the gacha machine!`
    writeFileSync(`${dir}/index.html`, `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(head)}</title>
<meta name="description" content="${esc(p.share)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(head)}">
<meta property="og:description" content="${esc(p.share)}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1152">
<meta property="og:image:height" content="768">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(head)}">
<meta name="twitter:description" content="${esc(p.share)}">
<meta name="twitter:image" content="${img}">
<style>
body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#faf7f2;font-family:sans-serif;color:#44403c}
main{max-width:420px;margin:32px 16px;text-align:center}
img{width:100%;border-radius:16px;border:2px solid #e7e5e4;box-shadow:0 8px 24px rgba(0,0,0,.08)}
.t{font-size:22px;font-weight:800;margin:20px 0 6px}
.d{font-size:14px;line-height:1.7;color:#78716c;margin:0 0 20px}
.btn{display:inline-block;background:#f472b6;color:#fff;font-weight:700;text-decoration:none;padding:10px 22px;border-radius:0.6rem}
</style>
</head>
<body>
<main>
<img src="card.png" alt="${esc(p.title)} prize card" width="384" height="256">
<p class="t">${esc(p.title)}</p>
<p class="d">${esc(p.share)}</p>
<a class="btn" href="${SITE}/commissions">Try your luck yourself</a>
</main>
</body>
</html>`)
}
console.log('Wrote 8 prize share pages into public/share/')
