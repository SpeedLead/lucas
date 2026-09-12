# Lucas's website 🏓📈🤖

My personal site. Built with Next.js 16, TypeScript, Tailwind CSS v4 and shadcn/ui.
There's a real ping pong game in the header — you can actually play it.

**Live:** https://lucas.vercel.app _(update this once Vercel gives you the real URL)_

---

## ✏️ How to change what the site says

**Almost everything lives in one file: [`src/lib/site-config.ts`](src/lib/site-config.ts).**

Open it, change the text, save. That's it — you never need to touch the components.

The one exception is the **Markets** section: those numbers aren't yours to type.
They're scraped live from Yahoo Finance every minute (see below).

Anything that still says `[fill me in]` is waiting for you, and it shows up
in italics on the page so it's easy to spot.

### Before you put this online
1. Replace `email:` with your real email address (right now it's a placeholder).
2. Fill in the `[fill me in]` values.
3. Update `url:` to your real Vercel address.

---

## 🚀 Running it on your computer

You need **Node 24** (this project has a `.nvmrc`, so `nvm use` picks the right one).

```bash
nvm use          # switches to Node 24
npm install      # only needed the first time
npm run dev      # then open http://localhost:3000
```

Other commands:

```bash
npm run build    # production build — this is what Vercel runs
npm run lint     # check for code mistakes
npx tsc --noEmit # check the TypeScript types
```

---

## 📈 Where the market numbers come from

The Markets section reads real prices off
[finance.yahoo.com](https://finance.yahoo.com/) — the strip of indices Yahoo
puts at the top of its own page. Nothing is typed in by hand and there's no API
key to sign up for.

- [`src/lib/market.ts`](src/lib/market.ts) pulls the numbers out of Yahoo's HTML.
- [`src/lib/market-server.ts`](src/lib/market-server.ts) does the fetching, and
  caches it so we ask Yahoo at most once a minute no matter how many people visit.
- [`src/app/api/market/route.ts`](src/app/api/market/route.ts) is what the page
  calls to refresh itself without a reload.

Two things to know:

1. **It can break.** We're reading Yahoo's web page, not an official feed, so if
   they redesign it the section shows a "couldn't load" card instead of numbers.
   The rest of the site is unaffected — and so is `npm run build`.
2. **How often it refreshes** is `market.refreshSeconds` in `site-config.ts`.
   Set it to `0` to stop the page refreshing itself.

---

## 📁 Where things are

```
src/
├── lib/site-config.ts        ← 👋 YOUR CONTENT. Edit this.
├── app/
│   ├── page.tsx              the page, just a list of sections
│   ├── layout.tsx            fonts + the stuff search engines read
│   └── globals.css           colors and theme
└── components/
    ├── site/                 one file per section of the page
    │   ├── pong-game.tsx     the ping pong game (canvas + physics)
    │   └── market-*.tsx      the live market board and its chart
    ├── motion/               reusable animations
    └── ui/                   shadcn/ui building blocks
```

---

## ♿ A note on animations

Every animation checks whether the visitor has asked their computer to
reduce motion (a setting some people need). If they have, the ping pong game
is replaced by a still picture and nothing moves. Please keep that behaviour
if you add new animations.

---

## 🌐 Putting it online (Vercel)

1. Push your changes: `git push`
2. Go to [vercel.com/new](https://vercel.com/new) and import this repo.
3. Vercel detects Next.js automatically — no settings to change.

After that, every `git push` updates the live site by itself.
