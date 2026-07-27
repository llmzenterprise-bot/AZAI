# AZ AI Geeks — AI Booking Portal (Next.js)

A production-grade, trilingual AI customer portal: chat + voice assistant,
self-serve appointment booking/rescheduling/cancellation, and accounts — built
on **Next.js 14 (App Router) + TypeScript + Tailwind + next-intl**.

This is the real codebase evolution of the single-file prototype (`../portal.html`).
It runs today with **no external services**; production integrations are stubbed
behind env vars (see `.env.example`) and documented in `../ARCHITECTURE.md`.

## Quick start

```bash
npm install
npm run dev
```

Open **http://localhost:3000** — you'll be redirected to `/en`. Try `/es` and `/fr`.

## What works out of the box (demo mode)

- **11 pages** — Home, About, Services, Book, My Appointments, Contact, FAQ, Login, Register, Privacy, Terms
- **Trilingual EN / ES / FR** — `/en /es /fr` routes, instant switch via the navbar, `hreflang`-ready (next-intl)
- **AI chat** — `POST /api/chat`, grounded to the knowledge base in `src/lib/data.ts` (never fabricates); routes "book / cancel / reschedule" intents into the app
- **Voice assistant** — real browser Web Speech API (recognition + synthesis); use Chrome or Edge with a mic
- **Auth + appointments** — register / login / logout, book (4-step wizard), reschedule, cancel — persisted in `localStorage`
- **Design** — bold/dark marketing pages, calm/light app surfaces (toggled by route in `BodyMode.tsx`)

## Turn on live AI (optional)

Add to `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

`/api/chat` will then phrase answers with Claude, still hard-grounded to the
knowledge base so it can't invent hours, prices, or promises. Without a key it
uses the deterministic grounded engine — identical response shape either way.

## Project structure

```
src/
  app/
    [locale]/            # all pages, locale-routed
      layout.tsx         # providers + Navbar + Footer + AssistantDock
      page.tsx           # Home  (+ about, services, book, appointments, …)
    api/chat/route.ts    # grounded AI endpoint (demo + live Claude)
  components/            # Navbar, Footer, AssistantDock (chat+voice), Toaster, BodyMode
  i18n/                  # next-intl routing, navigation, request config
  lib/
    data.ts              # services, staff, FAQ, knowledge base, grounded engine
    store.ts             # demo auth + appointments (localStorage)
  messages/{en,es,fr}.json
prisma/schema.prisma     # reference production data model (not yet wired)
```

## Path to production

Wire the stubs in `.env.example`, swap `src/lib/store.ts` for Auth.js + Prisma,
add the `/api/appointments` and `/api/voice` routes, and connect the calendar /
email / SMS / voice providers. Full plan: **`../ARCHITECTURE.md`**.

## Deploy

```bash
npm run build && npm start     # or push to Vercel (zero-config)
```
