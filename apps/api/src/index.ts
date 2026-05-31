import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from './db/index';

const app = new Hono();

app.use('*', cors());

// Health Check
app.get('/', (c) => {
  return c.json({
    message: 'Welcome to Curio API',
    status: 'healthy',
    version: '1.0.0'
  });
});

// Auth Routes

// 1. Sign Up
app.post('/api/auth/signup', async (c) => {
  try {
    const { phone, fullName, username } = await c.req.json();

    if (!phone || !fullName || !username) {
      return c.json({ error: 'All fields (phone, fullName, username) are required.' }, 400);
    }

    const userId = 'usr_' + Math.random().toString(36).substr(2, 9);
    
    // Check if phone or username already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE phone = ? OR username = ?').get(phone, username) as any;
    if (existingUser) {
      return c.json({ error: 'User with this phone number or username already exists.' }, 400);
    }

    // Insert user
    db.prepare('INSERT INTO users (id, phone, full_name, username) VALUES (?, ?, ?, ?)')
      .run(userId, phone, fullName, username);

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    return c.json({ user: newUser, success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 2. Log In
app.post('/api/auth/login', async (c) => {
  try {
    const { phone } = await c.req.json();

    if (!phone) {
      return c.json({ error: 'Phone number is required.' }, 400);
    }

    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;
    if (!user) {
      return c.json({ error: 'Account not found. Please sign up first.', signupRequired: true }, 404);
    }

    return c.json({ user, success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 3. Update Profile/Onboarding
app.post('/api/auth/onboarding', async (c) => {
  try {
    const { id, fullName, username, city, bio } = await c.req.json();

    if (!id) {
      return c.json({ error: 'User ID is required.' }, 400);
    }

    db.prepare('UPDATE users SET full_name = ?, username = ?, city = ?, bio = ? WHERE id = ?')
      .run(fullName, username, city, bio, id);

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return c.json({ user: updatedUser, success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Listing Routes

// 1. Create Listing
app.post('/api/listings', async (c) => {
  try {
    const data = await c.req.json();
    const { sellerId, title, description, categoryId, brand, condition, size, price, color, photos } = data;

    if (!sellerId || !title || !categoryId || !condition || !price || !photos) {
      return c.json({ error: 'Missing required listing fields.' }, 400);
    }

    const listingId = 'lst_' + Math.random().toString(36).substr(2, 9);
    const photosJson = JSON.stringify(photos);

    db.prepare(`
      INSERT INTO listings (id, seller_id, title, description, category_id, brand, condition, size, price, color, photos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(listingId, sellerId, title, description, categoryId, brand, condition, size, price, color, photosJson);

    const newListing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listingId) as any;
    if (newListing) {
      newListing.photos = JSON.parse(newListing.photos);
    }

    return c.json({ listing: newListing, success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 2. Fetch Listings
app.get('/api/listings', async (c) => {
  try {
    const listings = db.prepare('SELECT l.*, u.full_name as seller_name FROM listings l JOIN users u ON l.seller_id = u.id WHERE l.status = "active"').all() as any[];
    
    // Parse photos JSON for each listing
    const parsedListings = listings.map(l => ({
      ...l,
      photos: JSON.parse(l.photos)
    }));

    return c.json({ listings: parsedListings });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

const port = 3001;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
