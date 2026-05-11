# Supabase Diagnostics

Use `query-plan-validation.sql` in staging before production traffic increases. The file is read-only and contains index presence checks plus `EXPLAIN ANALYZE` templates for common access paths.

## Safe Run Procedure

1. Restore or seed staging with production-shaped synthetic data.
2. Open the Supabase SQL editor for staging, not production.
3. Set the sample user id in the SQL file to a staging test user.
4. Run one section at a time and save the output.
5. Confirm that queries use the expected composite indexes and avoid large sequential scans.

Do not paste database passwords or service-role keys into this file. Do not run destructive statements as part of this diagnostic pass.
