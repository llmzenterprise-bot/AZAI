# AZ AI Geeks — AI Customer Portal
## Production Architecture & Build Blueprint

This document is the bridge from the working prototype (`portal.html`) to a
production, scalable, developer-owned build. The prototype proves the UX; this
spec defines the real system behind it.

---

## 1. What the prototype already demonstrates

`portal.html` is a self-contained, runnable prototype with **no backend required**:

| Requirement | Prototype status |
|---|---|
| 11 pages (Home, About, Services, Book, My Appointments, Contact, FAQ, Login, Register, Privacy, Terms) | ✅ SPA hash-routed |
| AI **text chat** assistant | ✅ Knowledge-base engine, intent matching, booking hand-off |
| AI **voice** assistant | ✅ Real Web Speech API (recognition + synthesis), push-to-talk |
| Multilingual EN / ES / FR (instant, no reload) | ✅ Full i18n dictionary across UI, forms, chat, voice |
| Authentication + protected pages | ✅ Register / login / logout (localStorage) |
| Appointment book / reschedule / cancel | ✅ 4-step flow + management dashboard |
| Human escalation | ✅ Chat routes to hello@azaigeeks.com |
| Premium responsive design | ✅ Bold marketing pages, calm app surfaces, mobile-first |

**Simulated (needs real backend for production):** account storage, appointment
persistence across devices, the LLM behind the chat, the telephony voice agent,
email/SMS delivery. Those are mapped below.

> Open it: double-click `portal.html`, or host it anywhere static.
> Try: switch language (top-right), click 💬 chat, click 🎙 voice (needs Chrome/Edge + mic),
> register an account, book an appointment, then reschedule/cancel it.

---

## 2. Recommended technology stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router) + React + TypeScript** | SSR/SSG for SEO, component-based, one codebase for pages + API routes |
| Styling | **Tailwind CSS** + CSS variables (design tokens already in prototype) | Fast, consistent, matches the polished/minimal brief |
| UI components | **shadcn/ui** + Radix primitives | Accessible (WCAG), themeable, production-grade |
| i18n | **next-intl** or **next-i18next** | Instant locale switch, SEO-friendly `/en` `/es` `/fr` routes |
| Auth | **Auth.js (NextAuth)** or **Clerk** | Email/password, Google/Apple SSO, sessions, JWT |
| Database | **PostgreSQL** + **Prisma ORM** | Relational data (users↔appointments), type-safe |
| AI chat | **Claude (Anthropic API)** with tool-use + **RAG** over a vector store | Never fabricates — answers only from your knowledge base |
| Vector store | **pgvector** (in Postgres) or Pinecone | Stores embedded business knowledge for retrieval |
| Voice AI | **Vapi**, **Retell AI**, or **ElevenLabs + Twilio** | Low-latency, human-like voice, phone + web |
| Calendar | **Cal.com API** or **Google Calendar API** | Real availability + two-way sync |
| Email | **Resend** or **Postmark** | Confirmations, reminders |
| SMS | **Twilio** | Reminders, confirmations |
| Payments (optional) | **Stripe** | Deposits, paid bookings |
| Hosting | **Vercel** (app) + **Neon/Supabase** (Postgres) | Auto-scale, global edge, zero-config CI/CD |

---

## 3. Component hierarchy

```
<App>
├── <LocaleProvider>              # next-intl, instant EN/ES/FR
├── <AuthProvider>               # session context
├── <Layout>
│   ├── <Navbar> (LanguageSwitcher, AuthMenu, MobileMenu)
│   ├── <Footer>
│   └── <AssistantDock>          # floating, on every page
│       ├── <ChatWidget>         # streaming Claude responses
│       │   ├── <MessageList> / <TypingIndicator>
│       │   ├── <QuickChips>
│       │   └── <ChatInput> (+ mic → speech-to-text)
│       └── <VoiceOverlay>       # full-screen voice session
├── Pages (routes)
│   ├── / (Home)          ├── /about        ├── /services
│   ├── /book             # <BookingWizard>: Service→Staff→DateTime→Confirm
│   ├── /appointments     # protected — <AppointmentList> (reschedule/cancel)
│   ├── /contact          ├── /faq
│   ├── /login  /register # <AuthForms>
│   └── /privacy /terms
└── Shared: <ServiceCard> <SlotPicker> <Stepper> <Toast> <Modal>
```

---

## 4. Database schema (PostgreSQL / Prisma)

```prisma
model User {
  id           String        @id @default(cuid())
  name         String
  email        String        @unique
  phone        String?
  passwordHash String?       // null if SSO-only
  locale       String        @default("en")   // en | es | fr
  role         Role          @default(CUSTOMER)
  createdAt    DateTime      @default(now())
  appointments Appointment[]
}
enum Role { CUSTOMER STAFF ADMIN }

model Service {
  id            String        @id @default(cuid())
  slug          String        @unique
  durationMin   Int
  priceCents    Int           @default(0)
  active        Boolean       @default(true)
  translations  ServiceI18n[]
  appointments  Appointment[]
}
model ServiceI18n {          // localized name/description per language
  id        String  @id @default(cuid())
  serviceId String
  locale    String            // en | es | fr
  name      String
  description String
  service   Service @relation(fields: [serviceId], references: [id])
  @@unique([serviceId, locale])
}

model Staff {
  id           String        @id @default(cuid())
  name         String
  title        String
  active       Boolean       @default(true)
  availability Availability[]
  appointments Appointment[]
}
model Availability {          // weekly working hours per staff
  id       String @id @default(cuid())
  staffId  String
  weekday  Int              // 0–6
  startMin Int              // minutes from midnight
  endMin   Int
  staff    Staff  @relation(fields: [staffId], references: [id])
}

model Appointment {
  id         String   @id @default(cuid())
  userId     String
  serviceId  String
  staffId    String?          // null = no preference
  startsAt   DateTime
  endsAt     DateTime
  status     ApptStatus @default(CONFIRMED)
  locale     String
  notes      String?
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
  service    Service  @relation(fields: [serviceId], references: [id])
  staff      Staff?   @relation(fields: [staffId], references: [id])
  @@index([userId]) @@index([startsAt])
}
enum ApptStatus { CONFIRMED RESCHEDULED CANCELLED COMPLETED NO_SHOW }

model KnowledgeChunk {        // RAG source — AI answers ONLY from here
  id        String   @id @default(cuid())
  locale    String
  topic     String
  content   String
  embedding Unsupported("vector(1536)")?   // pgvector
}

model ConversationLog {      // audit + escalation trail
  id        String   @id @default(cuid())
  userId    String?
  channel   Channel            // CHAT | VOICE
  transcript Json
  escalated Boolean  @default(false)
  createdAt DateTime @default(now())
}
enum Channel { CHAT VOICE }
```

---

## 5. API architecture (REST — Next.js route handlers)

```
AUTH
  POST /api/auth/register            {name,email,password,locale}
  POST /api/auth/login               {email,password} → session/JWT
  POST /api/auth/logout
  GET  /api/auth/session

SERVICES & AVAILABILITY
  GET  /api/services?locale=es
  GET  /api/staff
  GET  /api/availability?serviceId&staffId&date   → open slots (calendar-synced)

APPOINTMENTS  (auth required)
  GET    /api/appointments                        → current user's upcoming
  POST   /api/appointments        {serviceId,staffId,startsAt,locale}
  PATCH  /api/appointments/:id    {startsAt|staffId}   → reschedule
  DELETE /api/appointments/:id                        → cancel
  ⮑ each write triggers: Calendar sync + Email + SMS confirmation

AI ASSISTANT
  POST /api/chat        {messages,locale}  → SSE stream from Claude
       ⮑ RAG: embed query → pgvector search → grounded answer
       ⮑ tools: getAvailability, createBooking, cancelBooking, escalateToHuman
  POST /api/voice/session                  → ephemeral token for Vapi/Retell web SDK
  POST /api/voice/webhook                  → telephony events, booking actions

NOTIFICATIONS (internal)
  sendConfirmation() · sendReminder()  (cron: 24h + 2h before)
```

**Grounding rule (critical):** the chat endpoint injects a system prompt that
forbids answering outside retrieved `KnowledgeChunk` context. If retrieval
returns nothing relevant → the AI says it doesn't know and offers human
escalation. This is what enforces *"never fabricate business information."*

---

## 6. AI assistant design (chat + voice)

- **Single brain, two channels.** Chat and voice call the same Claude agent with
  the same tools and knowledge base, so behavior is consistent.
- **Tool-use loop:** Claude decides when to call `getAvailability` / `createBooking`
  / `cancelBooking` / `escalateToHuman`, then confirms in natural language.
- **RAG for facts, tools for actions.** Facts (hours, pricing, services) come from
  the vector-searched knowledge base; actions (booking) go through the API.
- **Multilingual:** the user's active locale is passed to Claude; responses and
  the voice `lang` follow it. Voice recognition/synthesis locale switches with the UI.
- **Escalation:** low retrieval confidence, explicit "talk to a human," or repeated
  failure → hand off (email/ticket/live) and log the transcript.

---

## 7. Multilingual architecture

- Locale-prefixed routes: `/en/...`, `/es/...`, `/fr/...` (SEO: `hreflang` tags).
- Translation catalogs per namespace (JSON), loaded by `next-intl`.
- DB content localized via `ServiceI18n` + `locale` columns.
- Switch is instant and client-side; the choice persists on the `User` record and
  in a cookie for guests. **Add a language:** drop in a new catalog + `ServiceI18n`
  rows + a `voiceLangMap` entry — no code rewrite.

---

## 8. Security & compliance

- Passwords hashed with **bcrypt/argon2**; sessions as httpOnly JWT cookies.
- All appointment routes authorize on `userId` (users see only their own).
- HTTPS everywhere; secrets in env vars / Vercel secrets (never client-side).
- Rate-limit `/api/chat` and auth endpoints; validate input with **Zod**.
- **GDPR/CCPA:** data export + delete endpoints; consent banner; PII minimization.
- Conversation logs retained on a defined schedule, anonymized where possible.

---

## 9. Deployment

```
Vercel (Next.js app, edge + serverless API)
  ├── Neon / Supabase   → PostgreSQL + pgvector
  ├── Anthropic         → Claude chat brain
  ├── Vapi / Retell     → voice agent (web + phone)
  ├── Cal.com / Google  → calendar availability & sync
  ├── Resend + Twilio   → email + SMS
  └── Stripe (optional) → deposits / paid bookings

CI/CD: GitHub → Vercel preview per PR → production on merge to main.
Monitoring: Vercel Analytics + Sentry (errors) + Core Web Vitals.
```

**SEO/performance built in:** SSG for marketing pages, dynamic for app;
structured data (already in `index.html`), sitemap, `hreflang`, image
optimization, edge caching → fast LCP and strong ranking signals.

---

## 10. Suggested build phases

1. **Foundation** — Next.js + Tailwind + shadcn, i18n scaffold, port the prototype pages.
2. **Auth + DB** — Auth.js, Prisma schema, register/login/profile.
3. **Booking core** — services/staff/availability, calendar sync, book/reschedule/cancel, email+SMS.
4. **AI chat** — Claude + RAG knowledge base, tool-use booking, streaming, escalation.
5. **Voice** — Vapi/Retell web + phone agent sharing the same tools.
6. **Polish & launch** — accessibility audit, SEO, analytics, Stripe (optional), load-test, deploy.

---

*Prototype: `portal.html` · Marketing site: `index.html` · Both are self-contained and hostable today.*
