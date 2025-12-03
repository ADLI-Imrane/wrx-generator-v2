-- =============================================
-- WRX Generator V2 - Seed Data
-- =============================================

-- Note: This file creates test data for development
-- The test user will be created via the auth system

-- Create a test user (password: testpassword123)
-- This simulates what would happen when a user signs up
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Insert test user into auth.users (if not exists)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    test_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test@wrx-generator.local',
    crypt('testpassword123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    ''
  ) ON CONFLICT (id) DO NOTHING;

  -- Profile will be auto-created by trigger
  
  -- Insert sample links
  INSERT INTO public.links (id, user_id, original_url, slug, title, description, click_count) VALUES
    (uuid_generate_v4(), test_user_id, 'https://github.com', 'github', 'GitHub', 'The world''s leading software development platform', 150),
    (uuid_generate_v4(), test_user_id, 'https://google.com', 'google', 'Google', 'Search engine', 320),
    (uuid_generate_v4(), test_user_id, 'https://stackoverflow.com', 'so', 'Stack Overflow', 'Q&A for developers', 89),
    (uuid_generate_v4(), test_user_id, 'https://docs.nestjs.com', 'nestjs', 'NestJS Docs', 'NestJS Documentation', 45),
    (uuid_generate_v4(), test_user_id, 'https://react.dev', 'react', 'React', 'React Documentation', 210)
  ON CONFLICT DO NOTHING;

  -- Insert sample QR codes
  INSERT INTO public.qr_codes (user_id, content, title, style) VALUES
    (test_user_id, 'https://wrx-generator.com', 'Website QR', '{"size": 256, "foregroundColor": "#000000", "backgroundColor": "#FFFFFF", "errorCorrectionLevel": "M"}'),
    (test_user_id, 'https://github.com/wrx-generator', 'GitHub QR', '{"size": 512, "foregroundColor": "#24292e", "backgroundColor": "#FFFFFF", "errorCorrectionLevel": "H"}')
  ON CONFLICT DO NOTHING;

EXCEPTION WHEN OTHERS THEN
  -- Ignore errors (tables might not exist on first run)
  RAISE NOTICE 'Seed data skipped: %', SQLERRM;
END $$;
