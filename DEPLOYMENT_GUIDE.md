# 🚀 Supabase Deployment Guide

This guide walks you through deploying the database migrations to Supabase in the easiest way possible.

## Quick Deploy (2 minutes)

### Step 1: Open Supabase Dashboard
1. Go to: https://app.supabase.com
2. Select your project: **ngohyujweyxmrbbusufa**
3. Click the **SQL Editor** tab on the left

### Step 2: Create New Query
1. Click **New Query** button (top right)
2. You'll see an empty SQL editor

### Step 3: Copy & Paste Migrations
1. In your terminal, run:
   ```bash
   cd /Users/syedshah/Desktop/First\ App/matrimonial-app
   cat DEPLOY_MIGRATIONS.sql | pbcopy
   ```
   This copies all migrations to your clipboard.

2. In the Supabase SQL Editor:
   - Paste the SQL (Cmd+V)
   - Click **Run** button (or press Cmd+Enter)
   - Wait for completion (~10 seconds)

3. You should see:
   ```
   ✓ Success
   ```

### Step 4: Verify Tables Created
1. Go to **Database** tab (left sidebar)
2. Click **Tables**
3. Verify you see these 14 tables:
   - ✅ users
   - ✅ user_preferences
   - ✅ profiles
   - ✅ profile_photos
   - ✅ likes
   - ✅ connections
   - ✅ matches
   - ✅ conversations
   - ✅ messages
   - ✅ notifications
   - ✅ payments
   - ✅ subscriptions
   - ✅ profile_verification
   - ✅ reports

## Alternative: Split Deployment (if combined fails)

If the combined SQL fails, deploy migrations one at a time:

### Split Deploy Steps
1. Open Supabase SQL Editor → New Query
2. For each migration file **001-007**:
   ```bash
   # Copy migration file
   cat supabase/migrations/001_create_users_and_preferences.sql | pbcopy
   ```
3. Paste into SQL Editor → Run
4. Repeat for migrations 002-007

## Troubleshooting

### "Error: relation already exists"
- **Cause**: Migrations already ran once
- **Fix**: This is normal on retry - just ignore and move forward

### "Error: column already exists"
- **Cause**: Same as above
- **Fix**: Just ignore the error

### "Cannot connect to database"
- **Cause**: Supabase project loading
- **Fix**: Wait 10 seconds and try again

### "Permission denied"
- **Cause**: Using wrong role/key
- **Fix**: Make sure you're logged into correct Supabase account

## After Deployment

### 1️⃣ Enable Email Authentication
1. Go to **Auth** tab (left sidebar)
2. Click **Providers**
3. Make sure **Email** is **Enabled** (green toggle)
4. Click **Save**

### 2️⃣ Enable Phone OTP (Optional)
1. In **Auth → Providers**
2. Find **Phone**
3. Click **Enable**
4. Select **Twilio** or **MessageBird** for SMS provider
5. Click **Save**

### 3️⃣ Test the App
1. Start the dev server:
   ```bash
   cd /Users/syedshah/Desktop/First\ App/matrimonial-app
   npm run start
   ```

2. Navigate to auth flow:
   - Go to **Choose Gender** screen
   - Try **Email Auth** with: test@example.com / password123
   - Should succeed and show profile form

### 4️⃣ Verify in Dashboard
1. Go to **Auth → Users**
2. You should see your test@example.com user

## Database Status

**✅ Schema Ready**: All 14 tables defined with:
- RLS (Row Level Security) policies
- Real-time subscriptions enabled
- Proper indexes and constraints
- Foreign key relationships

**Tables Overview**:
```
users (base user records)
  ├─ user_preferences (gender, seeking)
  ├─ profiles (80+ detailed fields)
  │  └─ profile_photos (gallery images)
  │
  ├─ likes (swipe interactions)
  ├─ connections (mutual matches)
  ├─ matches (connected pairs)
  │
  ├─ conversations (message threads)
  │  └─ messages (chat history)
  │
  ├─ notifications (activity alerts)
  ├─ payments (transaction records)
  ├─ subscriptions (membership status)
  │
  └─ profile_verification (badge status)
     └─ reports (moderation flags)
```

## Next Steps

After verification:
1. ✅ Update ProfileDiscoveryScreen to use real database
2. ✅ Update FavoritesScreen to use likes database
3. ✅ Implement photo upload to Supabase Storage
4. ✅ Add real-time message subscriptions
5. ✅ Implement AsyncStorage caching layer

---

**Need Help?**
- Supabase Docs: https://supabase.com/docs
- SQL Editor Help: https://app.supabase.com/sql
- Check terminal for detailed error messages

**Time estimate**: 2-5 minutes total
