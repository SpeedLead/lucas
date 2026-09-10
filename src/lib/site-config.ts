// ┌─────────────────────────────────────────────────────────────────┐
// │  👋 LUCAS — THIS IS YOUR FILE. EDIT ANYTHING HERE.               │
// │                                                                 │
// │  Everything you see on the website comes from this one file.    │
// │  You never have to touch the component code to change your      │
// │  content. Change a string here, save, and the page updates.     │
// │                                                                 │
// │  Anything that still says "[fill me in]" is waiting for you.    │
// └─────────────────────────────────────────────────────────────────┘

export const FILL_ME_IN = "[fill me in]" as const;

export const siteConfig = {
  // ── The basics ────────────────────────────────────────────────────
  name: "Lucas",
  fullName: "Lucas",
  role: "Middle schooler",

  // ⚠️⚠️ REPLACE THIS BEFORE YOU DEPLOY ⚠️⚠️
  // This address is shown publicly on your site, so use one you're
  // happy for strangers to email. Then delete this comment.
  email: "YOUR_EMAIL@example.com",

  // Used for SEO + link previews. Update after Vercel gives you a URL.
  url: "https://lucas.vercel.app",

  description:
    "Middle schooler who plays table tennis, plays guitar, and builds things with AI. Come say hi.",

  // ── Hero ──────────────────────────────────────────────────────────
  // These rotate one after another under your name. Add as many as you want.
  taglines: [
    "plays table tennis 🏓",
    "plays guitar 🎸",
    "builds things with AI 🤖",
    "has business ideas 💡",
    "is looking for new friends 👋",
    "is beating you at pong right now →",
  ],

  heroIntro:
    "I'm a middle school student who spends most of his time at a ping pong table, behind a guitar, or arguing with a chatbot. This is my corner of the internet.",

  // ── About ─────────────────────────────────────────────────────────
  about: [
    "Hey! I'm Lucas. I'm in middle school, and I like making things — songs, spin serves, and lately, stuff with AI.",
    "I got into table tennis because it looked easy. It was not easy. I got into guitar because it looked hard. It was, in fact, hard. I'm still doing both.",
    "Right now I'm really into how AI works and how businesses work, and I'm trying to find where those two overlap. If you're into any of this, I'd genuinely like to meet you.",
  ],

  funFacts: [
    { label: "Grade", value: FILL_ME_IN, emoji: "🎒" },
    { label: "Home base", value: FILL_ME_IN, emoji: "📍" },
    { label: "Favorite food", value: FILL_ME_IN, emoji: "🍜" },
    { label: "Best subject", value: FILL_ME_IN, emoji: "📐" },
    { label: "Hidden talent", value: FILL_ME_IN, emoji: "🪄" },
    { label: "Dream trip", value: FILL_ME_IN, emoji: "✈️" },
  ],

  // ── Table tennis ──────────────────────────────────────────────────
  tableTennis: {
    blurb:
      "I will play you. Anywhere, any time, any table. Basement tables count. Dining tables count. The ones with the sagging net especially count.",
    stats: [
      { label: "Plays", value: FILL_ME_IN, hint: "right / left handed, shakehand or penhold" },
      { label: "Playing since", value: FILL_ME_IN, hint: "what year did you start?" },
      { label: "Go-to shot", value: FILL_ME_IN, hint: "forehand loop? backhand flick?" },
      { label: "Favorite pro", value: FILL_ME_IN, hint: "who do you watch?" },
      { label: "Will play you if", value: "you bring a paddle", hint: "" },
    ],
    // Numbers 0-100. These animate into bars on the page.
    // Be honest — or don't, it's your website.
    skills: [
      { label: "Forehand", value: 78 },
      { label: "Backhand", value: 64 },
      { label: "Serve", value: 85 },
      { label: "Footwork", value: 52 },
      { label: "Trash talk", value: 97 },
    ],
  },

  // ── Guitar ────────────────────────────────────────────────────────
  guitar: {
    blurb:
      "Six strings, four chords, one very patient family. Hover the strings over there — they actually move. That took me a while.",
    stats: [
      { label: "Playing since", value: FILL_ME_IN, hint: "what year?" },
      { label: "My guitar", value: FILL_ME_IN, hint: "brand / model, or just 'a beat up acoustic'" },
      { label: "Learning now", value: FILL_ME_IN, hint: "what song are you working on?" },
      { label: "Favorite riff", value: FILL_ME_IN, hint: "" },
    ],
  },

  // ── AI + business ─────────────────────────────────────────────────
  projectsBlurb:
    "Stuff I'm building, learning, or thinking way too much about. Most of it is unfinished. That's kind of the point.",

  projects: [
    {
      title: FILL_ME_IN,
      blurb: "Describe a thing you built or want to build. One or two sentences is plenty.",
      tag: "AI",
      status: "building",
      emoji: "🤖",
    },
    {
      title: FILL_ME_IN,
      blurb: "Maybe a business idea? Something you'd sell, or a problem you noticed.",
      tag: "Business",
      status: "thinking",
      emoji: "💡",
    },
    {
      title: FILL_ME_IN,
      blurb: "Something you learned recently that blew your mind.",
      tag: "Learning",
      status: "learning",
      emoji: "📚",
    },
    {
      title: "This website",
      blurb:
        "Built with Next.js, TypeScript and Tailwind. The ping pong game up top is real — I wrote the physics myself.",
      tag: "Build",
      status: "shipped",
      emoji: "🌐",
    },
  ],

  // ── Contact ───────────────────────────────────────────────────────
  contact: {
    heading: "Let's be friends",
    blurb:
      "Seriously. If you play table tennis, play guitar, are building something with AI, or just want to say hi — email me. I reply to everyone.",
    cta: "Say hi",
  },

  // Add your links here. Delete any you don't use.
  socials: [
    { label: "GitHub", href: "https://github.com/SpeedLead" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
export type Project = SiteConfig["projects"][number];
export type ProjectTag = Project["tag"];
export type ProjectStatus = Project["status"];
