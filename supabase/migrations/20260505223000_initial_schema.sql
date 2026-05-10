-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  city TEXT,
  verified_cnic BOOLEAN DEFAULT FALSE,
  rating_avg DECIMAL(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  wallet_balance DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Create listings table
CREATE TYPE listing_condition AS ENUM ('new_with_tags', 'like_new', 'good', 'fair');
CREATE TYPE listing_status AS ENUM ('draft', 'active', 'sold', 'archived');

CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  condition listing_condition NOT NULL,
  size TEXT,
  fabric TEXT,
  color TEXT[],
  price_pkr INT NOT NULL,
  original_price_pkr INT,
  photos JSONB NOT NULL, -- [{url, order, width, height}]
  status listing_status DEFAULT 'draft',
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  is_boosted BOOLEAN DEFAULT FALSE,
  boost_expires_at TIMESTAMPTZ,
  city TEXT,
  allow_offers BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sold_at TIMESTAMPTZ
);

-- Enable RLS on listings
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listings are viewable by everyone."
  ON listings FOR SELECT
  USING ( status = 'active' OR auth.uid() = seller_id );

CREATE POLICY "Users can create listings."
  ON listings FOR INSERT
  WITH CHECK ( auth.uid() = seller_id );

CREATE POLICY "Users can update own listings."
  ON listings FOR UPDATE
  USING ( auth.uid() = seller_id );

-- Create orders table
CREATE TYPE order_status AS ENUM ('pending_payment', 'paid', 'shipped', 'delivered', 'disputed', 'refunded', 'completed');
CREATE TYPE payment_method AS ENUM ('jazzcash', 'easypaisa', 'card', 'bank_transfer');

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) NOT NULL,
  buyer_id UUID REFERENCES profiles(id) NOT NULL,
  seller_id UUID REFERENCES profiles(id) NOT NULL,
  amount_pkr INT NOT NULL,
  platform_fee_pkr INT NOT NULL,
  shipping_fee_pkr INT NOT NULL,
  status order_status DEFAULT 'pending_payment',
  payment_method payment_method NOT NULL,
  payment_ref TEXT,
  escrow_released BOOLEAN DEFAULT FALSE,
  tracking_number TEXT,
  courier TEXT,
  shipping_address JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders as buyer or seller."
  ON orders FOR SELECT
  USING ( auth.uid() = buyer_id OR auth.uid() = seller_id );

CREATE POLICY "Buyers can create orders."
  ON orders FOR INSERT
  WITH CHECK ( auth.uid() = buyer_id );
