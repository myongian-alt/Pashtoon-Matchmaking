# Supabase Database Migrations

Complete PostgreSQL schema for the Pashtoon Matchmaking app using Supabase.

## Overview

7 migration files covering:
1. **Users & Preferences** - Auth extension + discovery filters
2. **Profiles & Photos** - 80+ field matrimonial profiles + photo metadata
3. **Social Interactions** - Likes, connection requests, matches
4. **Messaging** - Conversations and messages
5. **Notifications** - Activity feed with auto-triggers
6. **Payments & Subscriptions** - Payment history + premium membership
7. **Verification & Moderation** - Badges, verification, abuse reports

## How to Apply Migrations

### Option A: Using Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **SQL Editor**
3. For each migration file (001 → 007 in order):
   - Click **New Query**
   - Copy entire migration file content
   - Paste into editor
   - Click **Run**
   - Wait for "Success" message

### Option B: Using Supabase CLI (Automated)

```bash
# Install Supabase CLI (if not already)
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

### Option C: Using Supabase Migration Files (For Teams)

Place migration files in:
```
project/
└── supabase/
    └── migrations/
        ├── 001_create_users_and_preferences.sql
        ├── 002_create_profiles_and_photos.sql
        ├── 003_create_social_interactions.sql
        ├── 004_create_messaging.sql
        ├── 005_create_notifications.sql
        ├── 006_create_payments_and_subscriptions.sql
        └── 007_create_verification_and_moderation.sql
```

Then sync:
```bash
supabase db push
```

## Important: Run In Order

⚠️ **Must execute migrations 001 → 007 sequentially**

- **001** creates ENUMs and users table (foundation)
- **002** depends on users.id (references)
- **003** depends on users and likes
- **004** depends on users and matches
- **005** depends on all tables for triggers
- **006** depends on users for payment tracking
- **007** depends on profiles for verification

Running out of order will cause reference errors.

## Key Features Included

### ✅ Row Level Security (RLS)
- Every table has RLS enabled
- Users can only read/write their own data
- Public/verified data is readable by discovery queries
- System operations use service role

### ✅ Automatic Triggers
- Update timestamps on every table
- Auto-create user_preferences when user signs up
- Auto-create conversations when match is created
- Auto-create notifications on interactions (likes, messages, etc.)
- Auto-sync verified status between profile_verification and profiles
- Auto-accept mutual connections

### ✅ Indexes
- Search/filter indexes (city, education, marital_status)
- Foreign key indexes for joins
- Partial indexes for common queries (unread messages, active subscriptions)
- Optimized for discovery and real-time subscriptions

### ✅ Data Integrity
- CHECK constraints (age >= 18, match pairs normalized)
- UNIQUE constraints (one profile per user, one subscription per user)
- Foreign key constraints with CASCADE delete
- NOT NULL on critical fields

### ✅ Helper Functions
```sql
-- Check if user is premium
SELECT public.is_user_premium('user-uuid');

-- Get unread notification count
SELECT public.get_unread_notification_count('user-uuid');

-- Process payment (transactional)
SELECT * FROM public.process_payment(
  'user-uuid',
  30.00,
  'card'::payment_method_enum,
  'txn_12345'
);

-- Get user report count
SELECT * FROM public.get_user_report_count('user-uuid');
```

## Tables Created (14 Total)

| # | Table | Purpose | Rows Per User |
|---|-------|---------|---------------|
| 1 | `users` | Auth + metadata | 1 |
| 2 | `user_preferences` | Search filters | 1 |
| 3 | `profiles` | Matrimonial profile | 1 |
| 4 | `profile_photos` | Photo metadata | ~6 |
| 5 | `likes` | Like/reject history | ~50 |
| 6 | `connections` | Interest requests | ~10 |
| 7 | `matches` | Bi-directional matches | ~5 |
| 8 | `conversations` | Chat threads | ~3 |
| 9 | `messages` | Chat messages | ~200 |
| 10 | `notifications` | Activity feed | ~50 |
| 11 | `payments` | Transaction history | ~1-2 |
| 12 | `subscriptions` | Premium status | 1 |
| 13 | `profile_verification` | Badges + verification | 1 |
| 14 | `reports` | Abuse reports | ~0.1 |

## ENUM Types Created

```
gender_enum
gender_seeking_enum
marital_status_enum
body_type_enum
blood_group_enum
exercise_frequency_enum
education_level_enum
employment_status_enum
income_source_enum
work_timings_enum
prayer_frequency_enum
religion_importance_enum
religion_differences_enum
gender_roles_enum
polygamy_view_enum
family_closeness_enum
inlaw_living_enum
socialize_frequency_enum
forgiveness_level_enum
affection_enum
tradmodern_outlook_enum
sleep_schedule_enum
weekend_spending_enum
living_preference_enum
marriage_timing_enum
kids_preference_enum
photo_type_enum
like_action_enum
connection_status_enum
match_status_enum
notification_type_enum
payment_method_enum
payment_gateway_enum
payment_status_enum
subscription_type_enum
subscription_status_enum
verification_method_enum
report_type_enum
report_status_enum
```

## RLS Policies

All tables have RLS enabled:

- **users**: Own profile visible + public metadata
- **user_preferences**: Only own read/write
- **profiles**: Own + verified profiles readable
- **profile_photos**: Own + verified photos readable
- **likes**: Own sent/received visible
- **connections**: Both parties can read
- **matches**: Both parties can read
- **conversations**: Both parties can read
- **messages**: Conversation members can read
- **notifications**: Only recipient can read
- **payments**: Only own visible
- **subscriptions**: Only own visible
- **profile_verification**: Own + verified visible
- **reports**: Reporter and reported can read

## Next Steps

After migrations are applied:

1. **Phase 4**: Enable additional indexes + custom RLS policies (separate file)
2. **Phase 5**: Set up Supabase Storage buckets for photos/documents (separate file)
3. **Integration**: Connect React Native app to Supabase client
4. **Testing**: Run initial data queries to validate schema

## Troubleshooting

### Error: Relation already exists
- Migration already applied to this project
- Safe to skip and continue

### Error: Foreign key constraint
- Ensure migrations run in order (001 → 007)
- Run migrations in same transaction

### Error: Permission denied
- Ensure you're using project admin key
- Or logged in with Supabase CLI

### RLS blocks all queries
- Queries must be authenticated (use JWT)
- Test with authenticated user context
- Check RLS policies if blocked

## Performance Considerations

- **Indexes**: ~20 strategic indexes for discovery/filtering
- **Partial indexes**: For common queries (unread, active, verified)
- **Computed columns**: profile_strength, last_message_preview cached
- **Triggers**: Minimal overhead, only on write operations
- **ENUM types**: Validated at DB level (no bad data)

## Security

✅ RLS enabled on every table
✅ No passwords stored (Supabase Auth handles)
✅ Triggers prevent data inconsistency
✅ Foreign keys enforce referential integrity
✅ Phone/email unique + normalized

## Next Phase: Phase 4 & 5

Ready to proceed with:
- **Phase 4**: RLS Policies refinement + additional indexes
- **Phase 5**: Supabase Storage setup + bucket policies

