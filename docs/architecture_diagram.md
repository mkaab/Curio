# Curio — System Architecture Diagram

## High-Level Overview

```mermaid
graph TB
    subgraph "Client (Browser / PWA)"
        UI["Next.js App Router<br/>React 19 + HeroUI"]
        SW["Service Worker<br/>(Push Notifications)"]
    end

    subgraph "Railway (Node.js)"
        subgraph "Next.js Server"
            Pages["Pages & SSR"]
            API["API Routes"]
            SA["Server Actions"]
        end
    end

    subgraph "Supabase Cloud"
        Auth["Supabase Auth"]
        DB["PostgreSQL + RLS"]
        RT["Realtime<br/>(WebSocket)"]
        Storage["Storage<br/>(Images)"]
    end

    subgraph "External Services"
        Swich["Swich Payment Gateway"]
        VAPID["Web Push (VAPID)"]
    end

    UI --> Pages
    UI --> SA
    UI --> API
    UI <--> RT
    SW --> VAPID

    Pages --> DB
    SA --> DB
    API --> DB
    API --> Swich
    API --> VAPID

    UI --> Auth
    UI --> Storage
```

---

## Monorepo Structure

```mermaid
graph LR
    subgraph "Curio Monorepo (Turborepo)"
        subgraph "apps/web"
            direction TB
            A1["app/ — Pages & Routes"]
            A2["components/ — Shared UI"]
            A3["lib/ — Utilities"]
            A4["actions/ — Server Actions"]
            A5["api/ — API Routes"]
        end

        subgraph "packages/"
            P1["@curio/types"]
            P2["@curio/ui — ProductCard etc."]
            P3["@curio/validators"]
        end

        A1 --> P1
        A1 --> P2
        A1 --> P3
    end
```

---

## Page Map

```mermaid
graph TD
    subgraph "Public Pages"
        Home["/ — Homepage<br/>(Feed + Categories)"]
        Search["/search — Search & Filter"]
        Item["/item/[id] — Listing Detail"]
        User["/user/[id] — Seller Profile"]
        HowItWorks["/how-it-works"]
        StaticPages["Terms / Privacy / Returns<br/>Cancellation / Shipping / Mission"]
    end

    subgraph "Auth Pages"
        Login["/(auth)/login"]
        Signup["/(auth)/signup"]
        Callback["/auth/callback"]
        Waitlist["/waitlist"]
    end

    subgraph "Authenticated Pages"
        Chat["/chat/[id] — Conversation<br/>(Offers, Payment, Shipping, Disputes)"]
        Profile["/profile — Dashboard<br/>(Orders, Listings, Wallet, Settings)"]
        Sell["/sell — Create Listing"]
        Admin["/admin — Admin Dashboard<br/>(Disputes, Payouts, Users)"]
    end

    Home --> Search
    Home --> Item
    Item --> Chat
    Chat --> Profile
    Sell --> Profile
```

---

## API Routes & Server Actions

```mermaid
graph LR
    subgraph "API Routes (app/api/)"
        PA["/api/payment/swich/initiate<br/>→ Redirect to Swich"]
        PB["/api/payment/swich/webhook<br/>→ Server-to-Server confirmation"]
        PC["/api/payment/swich/callback<br/>→ Browser redirect after payment"]
        CR["/api/cron/auto-complete<br/>→ Auto-receive after 7 days"]
        PS["/api/push/send<br/>→ Send push notification"]
        VC["/api/verify-cnic<br/>→ OCR identity verification"]
    end

    subgraph "Server Actions (app/actions/)"
        TA["transaction.ts<br/>createTransaction()<br/>placeOrderCOD()<br/>updateTransactionStatusSecure()"]
        WA["wallet.ts<br/>creditSellerEarning()<br/>getWalletBalance()<br/>requestWithdrawal()"]
        AA["admin.ts<br/>resolveDispute()<br/>processWithdrawal()<br/>rejectWithdrawal()"]
    end
```

---

## Payment & Transaction Lifecycle

```mermaid
stateDiagram-v2
    [*] --> pending: Seller accepts offer<br/>(createTransaction)

    pending --> placed: Buyer pays via Swich<br/>OR placeOrderCOD()

    state "Inventory Locked" as inv
    pending --> inv: listing.status → sold
    inv --> placed

    placed --> shipped: Seller ships<br/>(updateTransactionStatusSecure)
    shipped --> received: Buyer confirms receipt<br/>OR auto-complete cron (7 days)
    shipped --> disputed: Buyer opens dispute

    received --> completed: Buyer leaves review

    disputed --> cancelled: Admin refunds buyer<br/>(agreed_amount + shipping)
    disputed --> received: Admin sides with seller

    received --> wallet_credited: creditSellerEarning()

    note right of wallet_credited
        Protected by:
        • wallet_balance_check constraint
        • unique_wallet_transaction constraint
        • Idempotent credit logic
    end note
```

---

## Components Map

```mermaid
graph TD
    subgraph "Shared Components (src/components/)"
        Header
        Footer
        Logo
        PWARegister

        PaymentModal["PaymentModal<br/>(COD vs Swich selection)"]
        ShippingModal["ShippingModal<br/>(Tracking ID + Courier)"]
        DisputeModal["DisputeModal<br/>(Reason + Description)"]
        ReviewModal["ReviewModal<br/>(Stars + Text)"]
        WalletTab["WalletTab<br/>(Balance, Earnings, Withdrawals)"]
        LiveSignupsTicker["LiveSignupsTicker<br/>(Social proof banner)"]
    end

    subgraph "Shared Packages (packages/ui/)"
        ProductCard["ProductCard<br/>(3-image grid, price, seller info)"]
    end
```

---

## Data Flow: Supabase Security Model

```mermaid
graph TD
    subgraph "Client-Side (Browser)"
        C1["Supabase Client<br/>(with user JWT)"]
    end

    subgraph "Server-Side (Server Actions & API Routes)"
        S1["Supabase Client<br/>(authenticated, respects RLS)"]
        S2["Supabase Admin Client<br/>(bypasses RLS)"]
    end

    subgraph "Supabase"
        RLS["Row Level Security<br/>(per-table policies)"]
        DB2["PostgreSQL"]
        Constraints["DB Constraints<br/>• wallet_balance_check<br/>• unique_wallet_transaction<br/>• wallet_user_id_key"]
    end

    C1 -->|"READ: listings, profiles, own chats"| RLS
    S1 -->|"READ/WRITE: user-scoped data"| RLS
    S2 -->|"WRITE: payment webhooks,<br/>admin actions, cron jobs"| DB2
    RLS --> DB2
    DB2 --> Constraints
```

---

## Proposed: AI Moderation Pipeline (Phase 4)

```mermaid
sequenceDiagram
    participant Seller
    participant NextJS as Next.js
    participant DB as Supabase DB
    participant EF as Edge Function
    participant AI as GPT-4o-mini
    participant Notif as Notification

    Seller->>NextJS: Upload listing (images + text)
    NextJS->>DB: INSERT listing (status: active)
    Note over Seller: Listing goes live instantly.<br/>Zero friction.

    DB->>EF: Database Webhook trigger
    EF->>AI: Send images + title + rules
    AI->>EF: Response (approved / rejected / suggestions)

    alt Tier 1: Catastrophic (NSFW, Scam)
        EF->>DB: UPDATE listing status → rejected
        EF->>Notif: Alert seller with reason
    else Tier 2: Quality (Bad lighting, Blurry)
        EF->>Notif: Send helpful suggestion<br/>"Clear photos sell 3x faster!"
        Note over DB: Listing stays active
    end
```

---

## External Service Dependencies

| Service | Purpose | Free Tier Limits |
|---|---|---|
| **Supabase** | Auth, DB, Realtime, Storage | 500MB DB, 1GB storage, 200 Realtime connections |
| **Railway** | Hosting (Next.js) | $5/mo hobby, scalable |
| **Swich** | Payment Gateway (Pakistan) | Per-transaction fees |
| **Web Push (VAPID)** | Push notifications | Unlimited (self-hosted) |
| **Tesseract.js** | CNIC OCR verification | Unlimited (client-side) |
| **Sentry** (planned) | Error tracking | 5K errors/mo free |
| **PostHog** (planned) | Product analytics | 1M events/mo free |
| **GPT-4o-mini** (planned) | Listing moderation | ~$2.50 per 1K listings |
