# Lucas's website 🏓🎸🤖

My personal site. Built with Next.js 16, TypeScript, Tailwind CSS v4 and shadcn/ui.
There's a real ping pong game in the header — you can actually play it.

**Live:** https://lucas.vercel.app _(update this once Vercel gives you the real URL)_

---

## ✏️ How to change what the site says

**Almost everything lives in one file: [`src/lib/site-config.ts`](src/lib/site-config.ts).**

Open it, change the text, save. That's it — you never need to touch the components.

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
    │   └── pong-game.tsx     the ping pong game (canvas + physics)
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
