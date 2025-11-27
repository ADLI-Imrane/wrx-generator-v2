-- Seed data for development
-- This file contains sample data for local development

-- Note: This seed file should only be used in development environments
-- Do not run in production!

-- ============================================
-- Sample Test User (created via Supabase Auth)
-- ============================================
-- Email: test@wrx.io
-- Password: Test123!
-- 
-- To create this user, use Supabase Auth signup
-- The profile will be auto-created via trigger

-- ============================================
-- Sample Links (requires a user to exist)
-- ============================================
-- INSERT INTO public.links (user_id, slug, original_url, metadata)
-- VALUES 
--     ('USER_UUID_HERE', 'github', 'https://github.com', '{"title": "GitHub"}'),
--     ('USER_UUID_HERE', 'google', 'https://google.com', '{"title": "Google"}'),
--     ('USER_UUID_HERE', 'example', 'https://example.com', '{"title": "Example"}');

-- ============================================
-- Reserved Slugs (prevent users from using these)
-- ============================================
-- These slugs are reserved for system use:
-- api, admin, dashboard, login, register, logout, 
-- settings, profile, pricing, about, contact, help,
-- terms, privacy, docs, blog, status, health

SELECT 'Seed file loaded - no data inserted (uncomment to seed)' AS status;
