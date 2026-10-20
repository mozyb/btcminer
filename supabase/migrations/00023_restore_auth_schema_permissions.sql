-- Restore USAGE on auth schema to all required Supabase roles
-- Root cause of "Database error querying schema" on login
GRANT USAGE ON SCHEMA auth TO authenticator;
GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;

-- Ensure supabase_auth_admin has full access to auth tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin;

-- Ensure authenticator can read auth schema (needed for PostgREST JWT validation)
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticator;

-- Re-grant public schema usage (belt-and-suspenders)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, authenticator;