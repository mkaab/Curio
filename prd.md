# PRD — **Bazaar** 🛍️
### Pakistan's Peer-to-Peer Fashion & Lifestyle Marketplace
> *"Purana nahi, vintage hai."*

---

## Table of Contents
1. [Vision & Mission](#1-vision--mission)
2. [Problem Statement](#2-problem-statement)
3. [Target Audience](#3-target-audience)
4. [Market Context](#4-market-context)
5. [Core Features](#5-core-features)
6. [User Flows](#6-user-flows)
7. [Tech Stack](#7-tech-stack)
8. [System Architecture](#8-system-architecture)
9. [Data Models](#9-data-models)
10. [API Design](#10-api-design)
11. [Pakistan-Specific Considerations](#11-pakistan-specific-considerations)
12. [Monetization](#12-monetization)
13. [MVP Scope](#13-mvp-scope)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Milestones & Roadmap](#15-milestones--roadmap)
16. [Risks & Mitigations](#16-risks--mitigations)

---

## 1. Vision & Mission

**Vision:** Build Pakistan's most trusted community marketplace for pre-loved fashion, electronics, and lifestyle goods — making sustainable consumption aspirational and accessible.

**Mission:** Empower every Pakistani to declutter their wardrobe, discover unique pieces, and participate in a circular economy — all within a mobile-first, Urdu/English bilingual web platform.

---

## 2. Problem Statement

| Pain Point | Who Feels It |
|---|---|
| No structured resale platform for fashion in PK | Sellers & buyers |
| OLX/Facebook groups = fraud, no trust layer | Both |
| Cash-on-delivery only, no buyer protection | Buyers |
| No size standardisation for Pakistani brands | Buyers |
| Sellers lack photo tools / listing guidance | Sellers |
| No authentication/grading for luxury items | Premium segment |

---

## 3. Target Audience

### Primary
- **Urban women 18–35** in Lahore, Karachi, Islamabad — selling/buying pret, luxury, and branded Western wear
- **Students** reselling fashion hauls, imported sneakers, accessories

### Secondary
- **Men 20–35** reselling streetwear, sneakers, electronics
- **Boutique micro-sellers** wanting a consignment-style storefront

### Persona Highlights
| Persona | Goal | Frustration |
|---|---|---|
| Ayesha, 24, Lahore | Sell last season's Sana Safinaz | No safe payment, strangers visit home |
| Bilal, 27, Karachi | Buy Nike SB at fair price | Fakes everywhere, no recourse |
| Sara, 31, Islamabad | Curate a sustainable wardrobe | Hard to find authentic branded pieces |

---

## 4. Market Context

- Pakistan apparel market: ~$11B, growing 8% YoY
- Second-hand market globally growing 3x faster than retail
- 130M+ smartphone users in PK, 60%+ on mobile web
- JazzCash & EasyPaisa combined: 60M+ wallets — payment infrastructure exists
- Competitors: OLX (horizontal, not fashion-focused), Instagram DMs (no escrow), no Vinted equivalent

---

## 5. Core Features

### 5.1 Authentication & Profiles
- [ ] Phone-number signup with OTP (JazzCash-compatible numbers)
- [ ] Optional Google / Apple SSO
- [ ] Profile: display name, bio, city, verification badge
- [ ] Seller rating system (1–5 stars) + review text
- [ ] Profile completeness score (nudges for trust)
- [ ] National ID verification (optional, unlocks "Verified Seller" badge)
- [ ] Portfolio: listings, sold items, reviews received

### 5.2 Listing Creation
- [ ] Up to 12 photos per listing (with in-browser compression)
- [ ] AI-assisted auto-tagging (category, color, brand detection)
- [ ] Smart title suggestions
- [ ] Condition grades: New with Tags / Like New / Good / Fair
- [ ] Pakistani clothing size system + standard EU/US size mapping
- [ ] Brand picker (curated PK brands: Khaadi, Gul Ahmed, Sana Safinaz, etc. + international)
- [ ] Fabric tag (lawn, chiffon, khaddar, cotton, etc.)
- [ ] Price input in PKR with "suggested price" nudge (based on similar sold items)
- [ ] Boost listing (promoted placement — monetization)
- [ ] Draft auto-save
- [ ] Bundle creation (multi-item discounts)

### 5.3 Discovery & Search
- [ ] Personalised home feed (collaborative filtering)
- [ ] Full-text search with Urdu transliteration support
- [ ] Filters: category, brand, size, condition, price range, city, color
- [ ] Sort: newest, price low/high, most liked
- [ ] Trending collections (curated by team + algo)
- [ ] "New In" feed and "Almost Gone" (low stock urgency)
- [ ] Saved searches with push notifications
- [ ] Explore by aesthetic (Boho, Formal, Streetwear, Desi Chic)

### 5.4 Buying & Checkout
- [ ] Add to Wishlist (heart)
- [ ] Make an Offer (counter-offer flow)
- [ ] "Buy Now" — instant checkout
- [ ] Secure escrow payment: funds held until buyer confirms receipt
- [ ] Payment methods: JazzCash, EasyPaisa, Bank Transfer (1-link), Card (Stripe for international)
- [ ] Shipping label generation (TCS, Leopards, M&P integrations)
- [ ] Order tracking page
- [ ] Buyer confirmation window (72h to raise dispute)
- [ ] Rating & review post-transaction

### 5.5 Messaging
- [ ] In-app chat (listing-scoped)
- [ ] Image sharing in chat
- [ ] Offer accepted / rejected push notifications
- [ ] Report / block user
- [ ] Automated "Don't share contact info" safety reminders

### 5.6 Seller Dashboard
- [ ] Earnings wallet (withdrawable to JazzCash / bank)
- [ ] Sales analytics (views, likes, conversion rate per listing)
- [ ] Active / sold / archived listings management
- [ ] Shipping label printing
- [ ] Payout history

### 5.7 Trust & Safety
- [ ] Escrow payment (no direct cash transfer)
- [ ] Dispute resolution flow (3-day window, admin arbitration)
- [ ] AI photo moderation (detect prohibited items, NSFW)
- [ ] Listing report flow
- [ ] "Safe meetup" option for local Lahore/Karachi/ISB buyers
- [ ] CNIC verification (tier 2 trust)

### 5.8 Admin Panel
- [ ] User management + ban/suspend
- [ ] Listing moderation queue
- [ ] Dispute management
- [ ] Payout approvals
- [ ] Analytics dashboard (GMV, DAU, conversion, take rate)
- [ ] Brand & category management
- [ ] Promotional banner management

---

## 6. User Flows

### 6.1 Seller: Post a Listing
```
Sign Up / Login
  → Add Listing
    → Upload photos (drag & drop / camera)
      → AI suggests category & title
        → Fill details (size, brand, condition, price)
          → Preview → Publish
            → Listing live → share on WhatsApp/Instagram
```

### 6.2 Buyer: Purchase Flow
```
Browse / Search
  → View Listing
    → Heart (wishlist) OR Make Offer OR Buy Now
      → [Buy Now] → Select shipping address
        → Choose payment (JazzCash / Card)
          → Pay → Escrow holds funds
            → Seller ships → Tracking number added
              → Buyer confirms receipt (or 72h auto-confirm)
                → Funds released to seller
                  → Both parties rate each other
```

### 6.3 Dispute Flow
```
Buyer raises dispute within 72h
  → Describe issue + photo evidence
    → Admin reviews (48h SLA)
      → Resolution: full refund / partial / release to seller
        → Funds disbursed accordingly
```

---

## 7. Tech Stack

### Frontend
| Layer | Technology | Rationale |
|---|---|---|
| Framework | **Next.js 15** (App Router) | SSR/SSG for SEO, server components, edge-ready |
| Language | **TypeScript 5** | Type safety across full stack |
| Styling | **Tailwind CSS v4** | Utility-first, purge-safe, design tokens |
| UI Components | **shadcn/ui + Radix UI** | Accessible, unstyled primitives |
| State Management | **Zustand** | Lightweight, no boilerplate |
| Server State | **TanStack Query v5** | Caching, pagination, optimistic updates |
| Forms | **React Hook Form + Zod** | Schema validation, performant |
| Animations | **Motion (Framer Motion v12)** | Smooth UX |
| Image upload | **Uppy + Cloudflare Images** | Client-side compression, CDN delivery |
| i18n | **next-intl** | Urdu (RTL) + English |
| PWA | **next-pwa** | Offline support, installable |

### Backend
| Layer | Technology | Rationale |
|---|---|---|
| Runtime | **Node.js 22 (LTS)** | Latest stable, native fetch |
| API Framework | **Hono.js** | Ultra-fast, edge-native, TypeScript-first |
| ORM | **Drizzle ORM** | Type-safe SQL, migrations, lightweight |
| Database | **PostgreSQL 17** (Neon serverless) | Relational, full-text search, JSON |
| Cache | **Upstash Redis** | Edge-compatible, rate limiting, sessions |
| Auth | **Better Auth** | Phone OTP, social login, session management |
| File Storage | **Cloudflare R2 + Images** | S3-compatible, free egress, image resizing |
| Search | **Meilisearch** (self-hosted on Railway) | Typo-tolerant, Urdu-friendly |
| Real-time | **Ably** | WebSocket chat, presence, notifications |
| Email | **Resend** | Transactional email |
| SMS/OTP | **Twilio + Jazz/Telenor local gateway** | OTP for PK numbers |
| Background Jobs | **Trigger.dev** | Async jobs, retries, scheduling |
| Payments | **JazzCash API + EasyPaisa API + Stripe** | PK-first payment stack |

### Infrastructure
| Layer | Technology | Rationale |
|---|---|---|
| Hosting (Frontend) | **Vercel** | Next.js native, edge network |
| Hosting (Backend) | **Railway** | Simple deployment, Postgres addon |
| CDN | **Cloudflare** | PK PoPs, DDoS protection |
| Monitoring | **Sentry** | Error tracking |
| Logging | **Axiom** | Structured logs |
| Analytics | **Posthog** | Product analytics, feature flags |
| CI/CD | **GitHub Actions** | Lint → Test → Deploy |
| Containerisation | **Docker** | Reproducible builds |

### AI / ML
| Purpose | Service |
|---|---|
| Auto-tagging listings | **Google Vision API** |
| Listing title suggestions | **Claude claude-sonnet-4-20250514 API** |
| Photo moderation | **AWS Rekognition** |
| Price suggestions | Custom ML (similar sold items regression) |
| Recommendations | **Qdrant** vector DB + embeddings |

---

## 8. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│           Web (Next.js PWA)  │  Mobile (future RN)          │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────┐
│                   Cloudflare CDN / WAF                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────▼────────────┐
         │    Vercel Edge Network    │  ← Next.js App (SSR/SSG)
         │    (Next.js Frontend)     │
         └─────────────┬────────────┘
                       │ API calls
         ┌─────────────▼────────────┐
         │    Railway (Hono API)     │  ← REST + WebSocket
         │    Port 8080              │
         └──┬──────────┬────────────┘
            │          │
   ┌─────────▼──┐  ┌───▼──────────┐
   │ Neon Postgres│  │ Upstash Redis│
   │ (Primary DB) │  │ (Cache/Sess) │
   └─────────────┘  └─────────────┘
            │
   ┌─────────▼──────────┐
   │  Meilisearch        │  ← Full-text search
   └────────────────────┘
            │
   ┌─────────▼──────────┐
   │  Cloudflare R2      │  ← Media storage
   │  + Images API       │
   └────────────────────┘
            │
   ┌─────────▼──────────┐
   │  Ably               │  ← Real-time messaging
   └────────────────────┘
```

---

## 9. Data Models

### users
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
phone         VARCHAR(20) UNIQUE NOT NULL
email         VARCHAR(255) UNIQUE
full_name     VARCHAR(100) NOT NULL
username      VARCHAR(50) UNIQUE NOT NULL
avatar_url    TEXT
bio           TEXT
city          VARCHAR(50)          -- Lahore | Karachi | Islamabad | other
verified_cnic BOOLEAN DEFAULT FALSE
rating_avg    DECIMAL(3,2) DEFAULT 0
rating_count  INT DEFAULT 0
wallet_balance DECIMAL(12,2) DEFAULT 0  -- PKR
is_active     BOOLEAN DEFAULT TRUE
created_at    TIMESTAMPTZ DEFAULT NOW()
```

### listings
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
seller_id     UUID REFERENCES users(id)
title         VARCHAR(150) NOT NULL
description   TEXT
category_id   INT REFERENCES categories(id)
brand_id      INT REFERENCES brands(id)
condition     ENUM('new_with_tags','like_new','good','fair')
size          VARCHAR(20)
fabric        VARCHAR(50)
color         VARCHAR(30)[]
price_pkr     INT NOT NULL
original_price_pkr INT
photos        JSONB NOT NULL             -- [{url, order, width, height}]
status        ENUM('draft','active','sold','archived') DEFAULT 'draft'
views         INT DEFAULT 0
likes         INT DEFAULT 0
is_boosted    BOOLEAN DEFAULT FALSE
boost_expires_at TIMESTAMPTZ
city          VARCHAR(50)
allow_offers  BOOLEAN DEFAULT TRUE
search_vector TSVECTOR                   -- full-text search
embedding     VECTOR(1536)              -- pgvector for similarity
created_at    TIMESTAMPTZ DEFAULT NOW()
sold_at       TIMESTAMPTZ
```

### orders
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
listing_id    UUID REFERENCES listings(id)
buyer_id      UUID REFERENCES users(id)
seller_id     UUID REFERENCES users(id)
amount_pkr    INT NOT NULL
platform_fee_pkr INT NOT NULL            -- 8% of amount
shipping_fee_pkr INT NOT NULL
status        ENUM('pending_payment','paid','shipped','delivered','disputed','refunded','completed')
payment_method ENUM('jazzcash','easypaisa','card','bank_transfer')
payment_ref   VARCHAR(100)
escrow_released BOOLEAN DEFAULT FALSE
tracking_number VARCHAR(100)
courier       VARCHAR(50)
shipping_address JSONB
dispute_id    UUID REFERENCES disputes(id)
created_at    TIMESTAMPTZ DEFAULT NOW()
```

### messages
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
conversation_id UUID NOT NULL
sender_id     UUID REFERENCES users(id)
content       TEXT
image_url     TEXT
is_read       BOOLEAN DEFAULT FALSE
created_at    TIMESTAMPTZ DEFAULT NOW()
```

### conversations
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
listing_id    UUID REFERENCES listings(id)
buyer_id      UUID REFERENCES users(id)
seller_id     UUID REFERENCES users(id)
last_message_at TIMESTAMPTZ
created_at    TIMESTAMPTZ DEFAULT NOW()
```

### reviews
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
order_id      UUID REFERENCES orders(id)
reviewer_id   UUID REFERENCES users(id)
reviewee_id   UUID REFERENCES users(id)
rating        SMALLINT CHECK (rating BETWEEN 1 AND 5)
body          TEXT
type          ENUM('buyer_to_seller','seller_to_buyer')
created_at    TIMESTAMPTZ DEFAULT NOW()
```

---

## 10. API Design

Base URL: `https://api.bazaar.pk/v1`

### Auth
```
POST   /auth/send-otp          { phone }
POST   /auth/verify-otp        { phone, otp } → { token, user }
POST   /auth/google             { idToken }
DELETE /auth/session            (logout)
```

### Users
```
GET    /users/:username         → public profile
PATCH  /users/me                (update profile)
GET    /users/me/wallet         → { balance, transactions[] }
POST   /users/me/withdraw       { amount, method, account }
```

### Listings
```
GET    /listings                ?q=&category=&brand=&size=&condition=&price_min=&price_max=&city=&sort=&page=
GET    /listings/:id
POST   /listings                (create)
PATCH  /listings/:id            (update)
DELETE /listings/:id
POST   /listings/:id/like
DELETE /listings/:id/like
POST   /listings/:id/boost      { days }
GET    /listings/:id/similar    → similar listings (vector search)
```

### Orders
```
POST   /orders                  { listing_id, shipping_address, payment_method }
GET    /orders/:id
PATCH  /orders/:id/ship         { tracking_number, courier } (seller)
POST   /orders/:id/confirm      (buyer confirms receipt)
POST   /orders/:id/dispute      { reason, evidence[] }
```

### Offers
```
POST   /listings/:id/offers     { amount_pkr }
PATCH  /offers/:id              { action: 'accept' | 'decline' | 'counter', counter_amount? }
```

### Messages
```
GET    /conversations           (my conversations)
GET    /conversations/:id/messages
POST   /conversations           { listing_id, initial_message }
POST   /conversations/:id/messages { content, image_url? }
```

### Search
```
GET    /search?q=&filters=      → { listings[], total, facets }
GET    /search/suggestions?q=   → { suggestions[] }
```

### Upload
```
POST   /upload/presign          { count, type: 'listing' | 'avatar' }
                                → [{ upload_url, final_url }]
```

---

## 11. Pakistan-Specific Considerations

### Language & Localisation
- **Bilingual UI**: English default with full Urdu translation (RTL support via `dir="rtl"`)
- **Urdu search**: Romanised Urdu ("kamiz", "shalwar", "dupatta") must match Urdu script terms
- **Local brands pre-loaded**: Khaadi, Gul Ahmed, Sana Safinaz, Sapphire, Limelight, Bonanza Satrangi, Alkaram, Maria B, Ethnic, Elan, Cross Stitch, etc.
- **Size standards**: Pakistani clothing sizes (XS/S/M/L/XL + custom "38/40/42" numeric) mapped alongside EU/US

### Payments
| Method | Provider | Use Case |
|---|---|---|
| JazzCash | JazzCash Merchant API | Primary — 60M+ wallets |
| EasyPaisa | Telenor MFS API | Secondary wallet |
| Bank Transfer | 1-Link / RAAST | High-value transactions |
| Credit/Debit Card | Stripe (PK) | Urban premium buyers |
| Cash on Delivery | Conditional | NOT in MVP (trust risk) |

- All prices in PKR (₨)
- Escrow mandatory — no direct transfers
- RAAST integration (SBP's instant payment system) for zero-fee transfers

### Shipping Partners
| Courier | Coverage | API |
|---|---|---|
| TCS | Nationwide | REST API available |
| Leopards | Nationwide | REST API available |
| M&P | Nationwide + remote | REST API available |
| Swyft | Urban (Lahore, KHI, ISB) | REST API available |

- Auto-generate shipping label via integrated courier API
- Buyer pays shipping unless seller offers free shipping
- Return shipping protocol (seller pays on legit disputes)

### Trust & Cultural Context
- **Home address privacy**: Seller only reveals city, never full address. Courier pickup model preferred
- **WhatsApp sharing**: One-tap share listing to WhatsApp (dominant messaging in PK)
- **Safe handover points**: Mapped "safe meetup" spots (coffee shops, shopping malls) for local deals
- **Islamic calendar**: Consider Eid sale season spikes (Eid-ul-Fitr, Eid-ul-Adha) — major listing influx
- **Lawn season**: March–June is peak season for lawn fabric resale — build seasonal collections

### Regulatory
- SECP e-commerce guidelines compliance
- SBP payment aggregator rules (partner with licensed PSP)
- Data localisation awareness (PTA regulations)
- Consumer Protection Act 2019 alignment

---

## 12. Monetization

| Revenue Stream | Model | Rate |
|---|---|---|
| **Platform fee** | % of sale on completed order | **8%** of sale price |
| **Listing boost** | Pay to appear at top of search/feed | ₨299 / 7 days |
| **Wardrobe spotlight** | Feature seller's profile | ₨799 / 14 days |
| **Authentication service** | Physical inspection of luxury items | ₨1,500–3,000 per item |
| **Bazaar Premium** (future) | No listing fees, priority support | ₨499/month |
| **Brand advertising** | Native sponsored listings for new brands | CPM/CPC model |

**Year 1 GMV target:** ₨500M (~$1.8M USD)
**Year 1 Revenue target (8% take):** ₨40M (~$145K USD)

---

## 13. MVP Scope

**Target: 8-week build**

### In MVP ✅
- Phone OTP signup / login
- List item (photos, details, price)
- Browse & search (Meilisearch)
- Wishlist
- Messaging (Ably)
- Make offer + accept/decline
- Buy Now → JazzCash payment → escrow
- Seller ships → tracking input
- Buyer confirm receipt → funds release
- Reviews (post-order)
- Basic seller dashboard (listings, earnings, payouts)
- Admin panel (moderate listings, manage disputes)
- WhatsApp sharing

### Post-MVP 🔜
- Urdu language toggle
- EasyPaisa + Card payments
- AI auto-tagging & price suggestions
- Recommendation engine
- Bundle listings
- Boost / promoted listings
- CNIC verification
- Authentication service (luxury)
- Mobile app (React Native)
- Eid seasonal collections

---

## 14. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | LCP < 2.5s on 4G (Pakistan avg 20 Mbps), FID < 100ms |
| **Availability** | 99.5% uptime SLA |
| **Scalability** | Handle 10K concurrent users at peak (Eid) |
| **Security** | HTTPS everywhere, OWASP Top 10 compliance, rate limiting on OTP |
| **Image optimization** | Auto WebP conversion, responsive sizing via CF Images |
| **Accessibility** | WCAG 2.1 AA |
| **SEO** | SSR for listing pages (indexable), OG tags for social sharing |
| **Data backup** | Daily automated DB snapshots, 30-day retention |
| **GDPR-lite** | User data export + deletion on request |

---

## 15. Milestones & Roadmap

### Phase 1 — Foundation (Weeks 1–3)
- [ ] Project scaffold (Next.js + Hono monorepo)
- [ ] DB schema + migrations (Drizzle)
- [ ] Auth: phone OTP + session
- [ ] File upload pipeline (R2 + CF Images)
- [ ] Listing CRUD + Meilisearch indexing
- [ ] Basic browse & search UI

### Phase 2 — Marketplace Core (Weeks 4–6)
- [ ] Offer flow + messaging (Ably)
- [ ] JazzCash payment integration + escrow logic
- [ ] Order lifecycle (pay → ship → confirm → release)
- [ ] Courier label generation (TCS)
- [ ] Reviews + ratings

### Phase 3 — Trust & Polish (Weeks 7–8)
- [ ] Seller dashboard + wallet
- [ ] Dispute resolution flow
- [ ] Admin panel
- [ ] WhatsApp share + OG meta
- [ ] PWA config
- [ ] Performance audit + Lighthouse ≥ 85
- [ ] Soft launch (invite-only, Lahore)

### Phase 4 — Growth (Months 3–6)
- [ ] Urdu localisation
- [ ] EasyPaisa + RAAST payments
- [ ] AI auto-tagging
- [ ] Boost/promoted listings
- [ ] Recommendation engine
- [ ] Public launch + marketing

---

## 16. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Payment integration delays (JazzCash API) | High | High | Start JazzCash onboarding Week 1; have EasyPaisa as fallback |
| Fake/counterfeit listings | High | High | AI moderation + community reporting + authentication service |
| Low seller supply at launch | Medium | High | "Founding Seller" programme — zero fees for first 6 months |
| Trust in escrow model | Medium | High | Clear escrow explainer, money-back guarantee marketing |
| Courier API instability | Medium | Medium | Fallback to manual tracking number input |
| Regulatory friction (SBP/PTA) | Low | High | Partner with licensed PSP (HBL Konnect or NayaPay) from day 1 |
| Cold start (two-sided marketplace) | High | High | Seed with curated "Bazaar Verified" listings from influencer closets |

---

## Appendix A: Folder Structure

```
bazaar/
├── apps/
│   ├── web/                    # Next.js 15 frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── (marketplace)/
│   │   │   │   ├── listings/
│   │   │   │   ├── profile/
│   │   │   │   └── orders/
│   │   │   ├── (seller)/
│   │   │   │   └── dashboard/
│   │   │   └── admin/
│   │   ├── components/
│   │   ├── lib/
│   │   └── messages/           # i18n (en, ur)
│   └── api/                    # Hono backend
│       ├── src/
│       │   ├── routes/
│       │   ├── middleware/
│       │   ├── services/
│       │   └── db/
│       └── drizzle/
│           └── migrations/
├── packages/
│   ├── ui/                     # Shared component library
│   ├── types/                  # Shared TypeScript types
│   └── validators/             # Shared Zod schemas
├── docker-compose.yml
└── turbo.json                  # Turborepo
```

## Appendix B: Environment Variables

```env
# Database
DATABASE_URL=

# Auth
BETTER_AUTH_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# Storage
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_IMAGES_TOKEN=

# Search
MEILISEARCH_HOST=
MEILISEARCH_API_KEY=

# Real-time
ABLY_API_KEY=

# Payments
JAZZCASH_MERCHANT_ID=
JAZZCASH_PASSWORD=
JAZZCASH_INTEGRITY_SALT=
EASYPAISA_STORE_ID=
STRIPE_SECRET_KEY=

# AI
ANTHROPIC_API_KEY=
GOOGLE_VISION_API_KEY=

# Email
RESEND_API_KEY=

# Analytics
POSTHOG_KEY=
SENTRY_DSN=
```

---

*PRD Version: 1.0 | Owner: Product Team | Last Updated: May 2026*
*Next review: Post-MVP launch (Week 8)*