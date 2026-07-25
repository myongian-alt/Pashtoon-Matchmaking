-- Migration 013: Add 'married' to marital_status_enum
-- Purpose: the original enum only covered never_married/divorced/widowed/
-- separated, with no way to represent a user who is currently married
-- (e.g. considering a second marriage). Postgres enum values can only be
-- added, not inserted transactionally alongside their first use, so this
-- migration only adds the value - application code in a later request is
-- what actually writes/reads it.

ALTER TYPE marital_status_enum ADD VALUE IF NOT EXISTS 'married';
