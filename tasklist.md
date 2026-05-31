# Curio Development Task List

Track our implementation progress as we build the premier preloved fashion marketplace.

---

## 🛠️ Phase 1: Database & Authentication (Production Supabase)
- [x] **Supabase Database Schema Setup**
  - [x] Define migration schemas: `profiles`, `listings` (with ENUM conditions), and `orders`
  - [x] Set up cascading foreign keys, tiered categories, and verified brands
  - [x] Apply Row Level Security (RLS) policies for secure client-direct inserts
- [x] **Authentication Integration**
  - [x] Implement standard Supabase Phone OTP client-side trigger (`signInWithOtp`)
  - [x] Implement verification code validation flow (`verifyOtp`)
  - [x] Write user profiles securely to the Supabase `profiles` table upon registration

## 👗 Phase 2: Create Listing Flow (Vinted Style)
- [x] **Listing Creation UI**
  - [x] Implement premium visual photo uploader (mocked local assets)
  - [x] Integrate tiered category selectors (Audience > Department > Type) referencing categories
  - [x] Add interactive condition cards with hover guidance
  - [x] Add size, brand string, and color tags
- [x] **Production Database Persistence**
  - [x] Insert new listing items directly to the Supabase `listings` table via browser client
  - [x] Fetch active listings from Supabase (`listings` joined with `profiles`) on homepage feed
  - [x] Auto-associate new listings with the active logged-in user session

## 🛍️ Phase 3: Marketplace Discoverability & Filters
- [x] **Listing Discoverability**
  - [x] Fetch active listings from Supabase to display in the feed dynamically
- [ ] Implement advanced category filtering sidebar/drawers
- [ ] Add search bar live indexing of active listings

---

> [!NOTE]
> All Supabase clients (`client.ts`, `server.ts`) have automatic HTTP prefix validation for environment security.
