# Curio — Database Entity-Relationship Diagram

> Reverse-engineered from every `.from()`, `.select()`, and `.insert()` call in the codebase.

## Full ER Diagram

```mermaid
erDiagram
    USER ||--o{ LISTING : "sells"
    USER ||--o{ CONVERSATION : "buyer_id"
    USER ||--o{ CONVERSATION : "seller_id"
    USER ||--o{ TRANSACTION : "buyer_id"
    USER ||--o{ TRANSACTION : "seller_id"
    USER ||--o{ FAVORITE : "favorites"
    USER ||--o{ REVIEW : "reviewer"
    USER ||--o{ REVIEW : "reviewee"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o| WALLET : "has one"
    USER ||--o{ PUSH_SUBSCRIPTION : "devices"
    USER ||--o{ DISPUTE : "reporter"

    LISTING ||--o{ CONVERSATION : "about"
    LISTING ||--o{ TRANSACTION : "purchased via"
    LISTING ||--o{ FAVORITE : "favorited"

    CONVERSATION ||--o{ CHAT_MESSAGE : "contains"
    CONVERSATION ||--o| TRANSACTION : "leads to"

    TRANSACTION ||--o{ DISPUTE : "disputed"
    TRANSACTION ||--o{ WALLET_TRANSACTION : "triggers"

    WALLET ||--o{ WALLET_TRANSACTION : "ledger"

    USER {
        uuid id PK
        string name
        string email
        string image
        string bio
        string phone
        string shipping_address
        string bank_name
        string bank_account_title
        string bank_account_number
        boolean is_admin
        boolean cnic_verified
        string cnic_number
        string cnic_name
        timestamp created_at
    }

    LISTING {
        int id PK
        uuid seller_id FK
        string title
        string description
        string department
        string subcategory
        string category
        string brand
        string condition
        string size
        float price
        jsonb images
        string status "active | sold | rejected"
        string moderation_status "pending | approved | rejected"
        timestamp created_at
    }

    CONVERSATION {
        int id PK
        uuid buyer_id FK
        uuid seller_id FK
        int listing_id FK
        string last_message
        timestamp last_message_at
        string last_offer_status
    }

    CHAT_MESSAGE {
        int id PK
        int conversation_id FK
        uuid sender_id FK
        string type "text | offer | counter_offer | system"
        string text
        float offer_amount
        string offer_status "pending | accepted | declined"
        timestamp timestamp
    }

    TRANSACTION {
        int id PK
        int listing_id FK
        int conversation_id FK
        uuid buyer_id FK
        uuid seller_id FK
        float agreed_amount
        float platform_fee
        float seller_payout
        float shipping_fee
        string status "pending | placed | shipped | received | completed | disputed | cancelled"
        string payment_gateway "cod | swich"
        string shipping_tracking_id
        timestamp created_at
    }

    FAVORITE {
        int id PK
        uuid user_id FK
        int listing_id FK
        timestamp created_at
    }

    REVIEW {
        int id PK
        int transaction_id FK
        uuid reviewer_id FK
        uuid reviewee_id FK
        int rating
        string comment
        timestamp created_at
    }

    DISPUTE {
        int id PK
        int transaction_id FK
        uuid reporter_id FK
        string reason
        string description
        string status "open | resolved"
        string resolution_notes
        timestamp created_at
        timestamp updated_at
    }

    WALLET {
        uuid id PK
        uuid user_id FK "UNIQUE"
        float balance "CHECK >= 0"
        timestamp created_at
        timestamp updated_at
    }

    WALLET_TRANSACTION {
        uuid id PK
        uuid wallet_id FK
        int transaction_id FK
        string type "deposit | withdrawal | sale_earning | refund | platform_fee"
        float amount
        string status "pending | completed | failed"
        string reference_id
        string reference_note
        timestamp created_at
    }

    NOTIFICATION {
        int id PK
        uuid user_id FK
        string type
        string message
        string link
        boolean is_read
        timestamp created_at
    }

    PUSH_SUBSCRIPTION {
        int id PK
        uuid user_id FK
        jsonb subscription
        timestamp created_at
    }

    WAITLIST {
        int id PK
        string email
        timestamp created_at
    }
```

---

## Views

| Name | Purpose | Columns |
|---|---|---|
| `public_user_profiles` | Public-facing user info (used in listings, conversations, reviews). Hides sensitive fields like CNIC, bank details, etc. | `id`, `name`, `email`, `image` (inferred) |

---

## Database Constraints (Verified)

| Constraint | Table | Purpose |
|---|---|---|
| `wallet_balance_check` | `wallet` | `CHECK (balance >= 0)` — prevents negative balances at the DB level |
| `wallet_user_id_key` | `wallet` | `UNIQUE (user_id)` — one wallet per user |
| `unique_wallet_transaction` | `wallet_transaction` | `UNIQUE (wallet_id, transaction_id, type)` — prevents double-crediting |
| `wallet_transaction_wallet_id_fkey` | `wallet_transaction` | FK to `wallet.id` |
| `wallet_transaction_transaction_id_fkey` | `wallet_transaction` | FK to `transaction.id` |

---

## Indexes (Recently Added)

| Index | Table | Column |
|---|---|---|
| `idx_listing_status` | `listing` | `status` |
| `idx_transaction_buyer` | `transaction` | `buyer_id` |
| `idx_transaction_seller` | `transaction` | `seller_id` |
| `idx_transaction_status` | `transaction` | `status` |
| `idx_conversation_buyer` | `conversation` | `buyer_id` |
| `idx_conversation_seller` | `conversation` | `seller_id` |
| `idx_chat_message_conversation` | `chat_message` | `conversation_id` |
| `idx_wallet_transaction_wallet` | `wallet_transaction` | `wallet_id` |
| `idx_notification_user` | `notification` | `user_id` |

---

## Relationships Summary

```mermaid
graph LR
    subgraph "Core Marketplace"
        U["user"] --> L["listing"]
        L --> C["conversation"]
        C --> CM["chat_message"]
        C --> T["transaction"]
    end

    subgraph "Financial"
        T --> WT["wallet_transaction"]
        W["wallet"] --> WT
        U --> W
    end

    subgraph "Trust & Safety"
        T --> D["dispute"]
        T --> R["review"]
    end

    subgraph "Engagement"
        U --> F["favorite"]
        L --> F
        U --> N["notification"]
        U --> PS["push_subscription"]
    end
```

---

## Analysis: What's Missing

| Gap | Impact | Priority |
|---|---|---|
| **No `listing_history` or audit table** | When a listing goes from `active` → `sold` → (dispute refund) → should it go back to `active`? There's no audit trail of status changes. | Medium (for dispute resolution edge cases) |
| **No `dispute_id` on `transaction`** | When a dispute is resolved, we update the transaction status. But we can't easily find which dispute caused a cancellation without joining through `dispute.transaction_id`. A backlink would simplify admin queries. | Low |
| **`moderation_status` exists but is unused** | The sell page inserts `moderation_status: "pending"` but nothing ever reads or acts on it. This is the hook for the AI moderation pipeline we designed. | Ready for Phase 4 |
| **No `deleted_at` / soft delete** | Listings and users can only be "active" or "sold". If a user wants to delete a listing, or if admin bans a user, there's no soft delete mechanism. | Medium |
| **`public_user_profiles` view columns are inferred** | I can see the view is queried for `name` and `email` but I can't verify the exact column list without checking Supabase directly. | Low |

> [!TIP]
> The `moderation_status: "pending"` field already exists in the listing insert — the database is already prepped for the AI moderation pipeline. When we build Phase 4, we just need to write the Edge Function that reads it.
