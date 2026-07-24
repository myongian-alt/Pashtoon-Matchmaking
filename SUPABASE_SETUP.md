# Supabase Integration Setup Guide

## 🎯 Overview

Your Supabase project is ready! This guide walks you through applying the database migrations and connecting your React Native app.

## ⚙️ Step 1: Apply Migrations to Supabase

### Option A: Using Supabase Dashboard (Recommended & Easiest)

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Apply Migrations (in order: 001 → 007)**
   - Open: `supabase/migrations/001_create_users_and_preferences.sql`
   - Copy all content
   - Paste into SQL Editor
   - Click **Run**
   - Wait for ✅ success message
   - **Repeat for each migration file (002 → 007)**

**Time estimate:** 5-10 minutes

### Option B: Using Supabase CLI (If you have CLI installed)

```bash
cd /Users/syedshah/Desktop/First\ App/matrimonial-app

# Set service role key
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run migrations
node scripts/run-migrations.js
```

Note: You'll need the **Service Role Key** (more powerful than Anon key)
- Find it in: Supabase Dashboard → Project Settings → API Keys

---

## 🔐 Step 2: Configure Authentication

### Enable Email/Password Auth
1. Go to **Supabase Dashboard** → **Auth** → **Providers**
2. Make sure **Email** is enabled (should be by default)
3. Click **Save**

### Enable Phone OTP Auth
1. Go to **Auth** → **Providers**
2. Find **Phone**
3. Enable it
4. Choose SMS provider (Twilio or MessageBird)
5. Add credentials if available (optional for testing)
6. Click **Save**

### Enable Google OAuth (Optional)
1. Go to **Auth** → **Providers**
2. Click **Google**
3. Add your Google OAuth credentials
4. Click **Save**

---

## 📦 Step 3: Verify Database Setup

1. Go to **Supabase Dashboard** → **Database** → **Tables**
2. You should see these 14 tables:
   - ✅ `users`
   - ✅ `user_preferences`
   - ✅ `profiles`
   - ✅ `profile_photos`
   - ✅ `likes`
   - ✅ `connections`
   - ✅ `matches`
   - ✅ `conversations`
   - ✅ `messages`
   - ✅ `notifications`
   - ✅ `payments`
   - ✅ `subscriptions`
   - ✅ `profile_verification`
   - ✅ `reports`

3. Check a few tables to verify data structure (click on each)
4. Verify RLS policies are enabled (click table → **RLS Policies** tab)

---

## 🚨 Step 4: SECURITY - Regenerate Your Keys

**IMPORTANT:** You shared your API keys publicly. Regenerate them immediately:

1. Go to **Supabase Dashboard** → **Project Settings** → **API Keys**
2. For **Anon Key**: Click **Regenerate** → Copy new key
3. For **Service Role Key**: Click **Regenerate** → Copy new key

3. **Update your app:**
   - Edit `.env` file
   - Replace `SUPABASE_ANON_KEY` with new key
   - Edit `src/lib/supabase.ts`
   - Replace `SUPABASE_ANON_KEY` constant with new key

4. **Commit to Git:**
   ```bash
   git add .
   git commit -m "chore: update Supabase API keys"
   git push
   ```

---

## 🔗 Step 5: Test Supabase Connection

Run this in your terminal to verify connection:

```bash
cd /Users/syedshah/Desktop/First\ App/matrimonial-app

# Start your app
npm run start

# Open in browser: http://localhost:19000
# (scan QR code with Expo Go app on phone if available)
```

Check the browser console for any errors.

---

## 🗄️ Step 6: Upload Sample Data (Optional)

To test the app with data, you can manually add sample profiles:

1. Go to **Supabase Dashboard** → **Database** → **profiles** table
2. Click **Insert** → **Insert row**
3. Fill in sample profile data
4. Click **Save**

Or use the app to create a profile:
1. Sign up with email/phone in the app
2. Complete profile form
3. Data auto-saves to Supabase

---

## 🎨 Step 7: Update Your App Code

Your app now has these new modules ready to use:

### In your screens, you can now import:

```typescript
// Authentication
import { signInWithEmail, signUpWithEmail, signInWithPhone, verifyOtp, signOut } from '../lib/auth';

// Database operations
import { 
  getProfile, 
  getDiscoveryProfiles, 
  likeProfile, 
  sendMessage,
  getNotifications 
} from '../lib/database';

// Supabase client
import { supabase } from '../lib/supabase';
```

### Example: Sign in with email

```typescript
import { signInWithEmail } from '../lib/auth';

const handleLogin = async (email: string, password: string) => {
  const response = await signInWithEmail(email, password);
  if (response.success) {
    // User logged in
    setIsAuthenticated(true);
  } else {
    // Show error
    console.error(response.error);
  }
};
```

---

## 🔄 Step 8: Real-time Subscriptions

Your database supports real-time updates:

```typescript
import { subscribeToMessages, subscribeToNotifications } from '../lib/database';

// Listen to new messages
const subscription = subscribeToMessages(conversationId, (payload) => {
  console.log('New message:', payload.new);
});

// Listen to notifications
const notifSub = subscribeToNotifications(userId, (payload) => {
  console.log('New notification:', payload.new);
});

// Cleanup when done
subscription.unsubscribe();
notifSub.unsubscribe();
```

---

## 📁 File Structure After Integration

```
matrimonial-app/
├── .env                           # Contains SUPABASE_URL and SUPABASE_ANON_KEY
├── src/
│   ├── lib/
│   │   ├── supabase.ts           # ✅ NEW: Supabase client setup
│   │   ├── auth.ts               # ✅ NEW: Auth functions
│   │   └── database.ts           # ✅ NEW: CRUD operations
│   ├── screens/
│   ├── context/
│   └── ...
├── supabase/
│   └── migrations/
│       ├── 001_...sql            # ✅ Applied
│       ├── 002_...sql            # ✅ Applied
│       ├── ...
│       └── 007_...sql            # ✅ Applied
└── scripts/
    └── run-migrations.js         # ✅ Migration runner
```

---

## ✅ Checklist

- [ ] Migrations applied to Supabase (all 7 files)
- [ ] 14 tables created and visible in Dashboard
- [ ] Auth providers configured (Email, Phone)
- [ ] API keys regenerated and updated in `.env`
- [ ] App can start without errors (`npm start`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Changes committed to Git

---

## 🆘 Troubleshooting

### Error: "Cannot connect to Supabase"
- Verify `.env` file has correct URL and key
- Check network connection
- Verify Supabase project is running

### Error: "RLS policy violation"
- Ensure user is authenticated before database operations
- Check RLS policies in Dashboard → Database → Policies

### Error: "Table does not exist"
- Verify all 7 migrations were applied
- Check Database → Tables section in Dashboard

### Error: "Auth provider not configured"
- Go to Auth → Providers in Dashboard
- Enable Email/Phone providers

---

## 📚 Useful Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Native Supabase Client](https://supabase.com/docs/reference/javascript/introduction)
- [Database Query Examples](https://supabase.com/docs/guides/database/overview)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)

---

## 🎉 Next Steps

1. ✅ Apply all migrations
2. ✅ Configure auth providers
3. ✅ Test Supabase connection
4. 🔄 **Next**: Update UserContext to use Supabase Auth
5. 🔄 **Next**: Update screens to use database queries
6. 🔄 **Next**: Implement caching layer with AsyncStorage
7. 🔄 **Next**: Deploy to production

---

## Questions?

If you get stuck:
1. Check Supabase Dashboard logs (bottom right)
2. Review browser console errors
3. Check migration files for syntax
4. Verify RLS policies are correct

