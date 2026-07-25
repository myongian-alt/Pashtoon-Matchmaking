# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Khpalwali — an Expo/React Native Pashtoon matrimonial app (Expo 56, React Native 0.72.8, TypeScript strict, React Navigation 7), backed by Supabase (Postgres + Auth + Storage, project ref `ngohyujweyxmrbbusufa`). This directory (`matrimonial-app/`) is the git root and the working directory for everything below.

## Commands

```bash
npm install --legacy-peer-deps   # plain `npm install` frequently fails on Expo 56 peer-dep conflicts
npm run start                    # expo start (Metro, choose platform interactively)
npm run web                      # expo start --web
npm run android / npm run ios
npx tsc --noEmit                 # type-check — the only automated validation in this repo (no test framework or lint script is configured)
npx expo start -c                # clear Metro cache when edits surface stale/phantom errors
```

There is no test runner and no lint script — `tsc --noEmit` passing is the bar for "compiles."

### Supabase migrations

Migrations live in `supabase/migrations/`, numbered, and must be applied **in order** — each depends on ENUMs/tables an earlier one creates. `deploy-migrations.js`, `deploy-direct.js`, and `scripts/run-migrations.js` all attempt a service-role/API push but fall back to "deploy manually" in their own error handling — don't use them.

The working path is the Supabase CLI (`supabase` is installed; run `supabase login` interactively first, then `supabase link --project-ref ngohyujweyxmrbbusufa`). **Important**: this project's migrations were originally applied by hand through the Dashboard SQL Editor, so the CLI's remote migration-history table does not necessarily reflect reality — `supabase migration list` can show every local migration as "not applied" even when the tables already exist. Before ever running `supabase db push`:
1. `supabase db query --linked "select table_name from information_schema.tables where table_schema='public';"` (and similarly check `pg_policies`/`storage.buckets` for non-table migrations) to see what's actually live.
2. `supabase migration repair --status applied --linked <versions...>` to mark the already-applied ones without re-running them.
3. `supabase db push --dry-run` to confirm only the genuinely-missing migrations would run, then `supabase db push --yes`.

Skipping this and running a blind `db push` will try to `CREATE TYPE`/`CREATE TABLE` things that already exist and fail loudly (or worse). `DEPLOY_MIGRATIONS.sql` is a pre-bundled copy of migrations 001–007 only — it's stale and excludes everything from 008 onward; ignore it in favor of the CLI flow above.

## Architecture

### Provider nesting & navigation (`src/navigation/AppNavigator.tsx`)

```
FormProvider > UserProvider > ProfileHydrationBridge > NotificationsProvider > NavigationContainer > Stack.Navigator
```

`RootStackParamList` in this file is the single source of truth for every screen and its params — keep it synchronized when adding/removing screens. Navigation flow: `Splash → Onboarding → ChooseGender → AuthSelection → (EmailAuth | PhoneAuth→OtpVerification | guest) → Tabs`, with `ProfileCompletion`, `ProfileForm`, `PaymentSuccess`, `ProfileDetail`, and `Premium` branching off the stack. `Tabs` (`TabNavigator.tsx`) holds 5 bottom tabs: Discover, Home, Favorites, Notifications, Account. There are two separate tab-bar implementations that must be kept in sync manually — the real `Tab.Navigator` in `TabNavigator.tsx`, and `components/common/AppBottomNav.tsx`, a lookalike strip manually rendered on stack screens that live outside `Tabs` (`ProfileDetail`, `ProfileForm`, `ProfileCompletion`, `Premium`, `PaymentSuccess`) since those aren't nested inside the real tab navigator.

`AccountScreen` (the Account tab) shows a guest empty-state (sign-in prompt) when `isGuest`; otherwise it's the only place in the app that surfaces subscription status, payment history, verification status, discovery preferences (`user_preferences` table), notification/email/phone settings, account deactivation, and sign-out.

Auth success (email sign-in/up, OTP verify) resets navigation straight to `Tabs`, not `ProfileForm` — profile completion is a separate, later, user-initiated flow (`Home → ProfileCompletion → ProfileForm`).

`ProfileFormScreen` is a two-phase flow, not a single linear wizard: a **required** phase (`MANDATORY_FIELDS` - name, DOB, phone, marital status, country, city, education, profession) that's actually validated before continuing (unlike the rest of the form, which never validates), then an **optional** phase (`optionalSections`/`optionalFieldConfigs` - Photos, Physical, Career, Financial, Religious, Values, Family, Emotional, Lifestyle, Marriage) that can be finished from any section via "Skip remaining & finish", not just the last one. Finishing (from any point in the optional phase) saves the profile and navigates to `ProfileCompletion`, which now has its own "Skip" (header button + inline link) going straight to `Tabs` → Discover instead of requiring payment. Returning users with all mandatory fields already filled skip straight to the optional phase on reopening the form (checked via `getMissingMandatoryFields(formData)` at mount).

`ProfileHydrationBridge` (defined inline in `AppNavigator.tsx`) loads a signed-in user's saved `profiles` row + `profile_photos` back into `FormContext` once per session. It has to sit inside both `UserProvider` (for `userId`) and `FormProvider` (for `updateFormData`), which is why it's a bridge component rather than logic inside either context.

`App.tsx` vs `App.web.tsx`: native wraps the navigator in `GestureHandlerRootView`; web doesn't need it and just renders the navigator directly (Metro/webpack resolve `.web.tsx` automatically for the web target).

### State

- **`UserContext`** — auth/session state (hydrated from `supabase.auth.getSession()` + `onAuthStateChange`), plus `selectedGender`, `isGuest`, `profileCompleted` (mirrored to both AsyncStorage and the `user_app_state` table).
- **`FormContext`** — the ~90-field matrimonial profile form (`ProfileFormData`), held entirely in memory. `calculateProfileStrength()` computes a fill-rate client-side; it is not auto-persisted anywhere — callers must pass the computed value in explicitly when saving.
- **`NotificationsContext`** — 3 hardcoded notification items; not backed by the `notifications` table.

### Data layer (`src/lib/`)

- **`supabase.ts`** — client + a hand-written `Database` type that only covers `users`/`profiles`/`subscriptions`/`notifications`/`messages` (not the full 15-table schema). **Credentials are hardcoded here**, not read from `.env` — nothing in the app reads `.env` (`babel.config.js` has no dotenv plugin); only the Node deploy scripts do.
- **`auth.ts`** — thin wrappers over Supabase Auth (email, phone OTP, Google OAuth, session, reset, `updateEmail`/`updatePhone` — both go through `supabase.auth.updateUser()` and typically require the user to confirm the change via a link/code before it takes effect).
- **`database.ts`** — all CRUD/RPC calls: profiles, discovery, likes, connections, matches, messaging, notifications, payments, verification, discovery preferences (`getUserPreferences`/`upsertUserPreferences`), account settings (`getAccountSettings`/`setNotificationsEnabled`/`deactivateAccount`), realtime channel subscriptions, plus the `upsertCurrentUserProfile` / `mapProfileRowToFormSnapshot` save↔hydrate pair and `syncProfilePhotos` / `getProfilePhotos`.
- **`storage.ts`** — uploads picked images to the `profile-photos` Storage bucket (fetch → arrayBuffer → upload, the standard RN/Expo pattern) and returns a public URL.
- **`aiCoach.ts`** — rule-based (not LLM) profile-completeness tips and match recommendations, scored by city/education/profession/age overlap.
- **`selfProfile.ts`** — `buildSelfProfileFromForm(formData, selectedGender)`, the one shared mapping from in-memory `FormContext` state to the object `ProfileDetailScreen`'s `isSelfProfile` view expects. Used by `HomeScreen`, `ProfileFormScreen`, and `AccountScreen` — extend this instead of re-deriving the shape a fourth time.

### Database (`supabase/migrations/`)

14 migrations, 15+ tables, ~39 enums, RLS enabled on every table, and heavy trigger automation: auto-create `user_preferences` on signup, auto-create a `conversation` when a `match` is inserted, auto-accept mutual `connections`, auto-notify on like/request/message/match/payment/verification, auto-sync `profile_verification.is_verified` into `profiles`. Helper RPCs: `is_user_premium`, `process_payment`, `get_unread_notification_count`, `get_user_report_count`.

Load-bearing things to know before changing this layer:
- **`public.profiles` has no `education` column — it's `education_level`, a strict Postgres enum (`education_level_enum`: `high_school`/`bachelors`/`masters`/`phd`/`diploma`), separate from `degree_name` (free-text VARCHAR).** This was previously a serious live bug — `upsertCurrentUserProfile`, `getDiscoveryProfiles`, `getMatches`, and two functions in `aiCoach.ts` all referenced the nonexistent `education` column and failed with Postgres `42703` on every real (non-guest) use, confirmed by driving a real signup through the app. **Fixed**: all five now use `education_level`/`degree_name` correctly, via the `EDUCATION_LEVEL_MAP`/`EDUCATION_LEVEL_DISPLAY` pair in `database.ts` (same pattern as `MARITAL_STATUS_MAP`/`MARITAL_STATUS_DISPLAY` — UI dropdown strings like `'Bachelors'` never match Postgres enum values like `bachelors` directly, so any enum-backed field needs both a write-direction and read-direction map). If you add another enum-backed profile field, follow this same two-map pattern rather than passing the UI string straight through.
- **`create_user_preferences_on_signup` (the trigger that fires on every first insert into `public.users`) had its own separate enum-cast bug**, unrelated to the one above: its `CASE WHEN ... THEN 'female' ELSE 'male' END` resolved to `text`, which Postgres won't implicitly cast to `gender_seeking_enum` inside an INSERT built from a CASE expression. This silently broke `ensureCurrentUserRecord` (called by `upsertCurrentUserProfile` before every profile save) for any user whose `public.users` row didn't already exist — i.e. every real first-time profile save. **Fixed in migration 014** by casting the CASE expression explicitly (`(...)::gender_seeking_enum`). Both this and the `education` bug had to be fixed together before profile saving actually worked end-to-end (verified by completing the real `ProfileForm` flow and confirming the row landed correctly in `profiles`).
- **`.single()` vs `.maybeSingle()`**: several read functions in `database.ts` originally used `.single()` on tables where a zero-row result is the common case (no subscription yet, no profile yet, etc.) — `.single()` throws `PGRST116` in that case instead of returning `null`. `getProfile`, `getSubscriptionStatus`, and `getProfileVerificationStatus` have been fixed to `.maybeSingle()`; if you add a new one-row-per-user lookup, default to `.maybeSingle()` unless the row is truly guaranteed to exist (e.g. `user_preferences`, which has an auto-create trigger).
- **`upsertCurrentUserProfile` only persists a subset of the form's ~90 fields** (name, DOB, marital status, city, nationality, phone, education level, degree name, profession, about-me, profile strength). The rest — Physical, Financial, Religious, Values, Family, Emotional, Lifestyle, Marriage sections — are filled in the UI but currently dropped on save. Known gap, not something to silently "fix" by expanding scope without checking first.
- **`marital_status_enum` includes `married`** (migration 013, deployed) alongside `never_married`/`divorced`/`widowed`/`separated`, for users who are currently married (e.g. considering a second marriage). Postgres enum values can only be appended, not inserted mid-list transactionally with their first use — a new enum value migration should only ever add the value, never write/read it in the same migration.
- **`profiles`/`profile_photos` SELECT policies gate on `is_verified` OR an active `users` row** (migration 010, deployed). **Photo upload** needs the `profile-photos` Storage bucket + owner-write RLS + the gallery `display_order` cap raised from 4 to 5 (migration 011, deployed).
- **The `id` on list/nav items is not always the target's `user_id`.** `ProfileListItem` and the `ProfileDetail` nav param carry a separate `userId` field for this reason — `id` can be a `profiles.id` (discover) or a `matches.id` (matches tab). Anything writing to `likes`/`connections` (which reference `users.id`) must use `.userId`, not `.id`.

### Known environment gotchas

- Phone OTP needs a Phone provider + SMS provider configured in Supabase Auth — `"Unsupported phone provider"` is a backend config issue, not a client bug. Supabase's Test Phone Numbers/OTPs must be entered **without** a `+` prefix (e.g. `971555826960=123456`). Real delivery failures are usually Twilio routing/config (`21704` no sender in service, `21612` invalid destination-route pairing) — a 200 from `/auth/v1/otp` does not mean the SMS was delivered.
- Running the web dev server with `CI=1` disables Metro's file-watcher/reload — fine for a one-off headless check, but edits won't hot-reload; drop `CI` (or restart the server) for iterative work.
- Never hardcode service-role keys — the deploy scripts read `SUPABASE_SERVICE_ROLE_KEY` from the environment; don't commit it or paste it into scripts/docs.
