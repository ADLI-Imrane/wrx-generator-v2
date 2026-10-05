import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { UpdateProfileDto } from './dto';

describe('AuthService profile access', () => {
  const userId = '2c783f2e-3d72-41b9-83d6-a6adbe6e8501';
  const row = {
    id: userId,
    email: 'ada@example.com',
    full_name: 'Ada Lovelace',
    job_title: 'Engineer',
    avatar_path: `${userId}/avatar`,
    company_logo_path: `${userId}/company-logo`,
    tier: 'free',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };

  function setup() {
    const query = {
      update: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: row, error: null }),
    };
    const supabase = {
      from: jest.fn().mockReturnValue(query),
      storage: { from: jest.fn().mockReturnValue({
        createSignedUrl: jest.fn(async (path: string) => ({ data: { signedUrl: `https://storage.test/sign/${path}` }, error: null })),
      }) },
    };
    const service = new AuthService({ getAdminClient: () => supabase } as unknown as SupabaseService);
    return { service, query, supabase };
  }

  it('updates only explicitly mapped identity columns', async () => {
    const { service, query } = setup();
    const updates = new UpdateProfileDto();
    updates.fullName = 'Ada Lovelace';
    updates.jobTitle = 'Engineer';
    updates.primaryBrandColor = '#235EE7';

    const result = await service.updateProfile(userId, updates);

    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({
      full_name: 'Ada Lovelace',
      job_title: 'Engineer',
      primary_brand_color: '#235EE7',
    }));
    const writtenColumns = Object.keys(query.update.mock.calls[0][0]);
    expect(writtenColumns).not.toEqual(expect.arrayContaining([
      'email', 'tier', 'stripe_customer_id', 'stripe_subscription_id', 'id',
    ]));
    expect(result.email).toBe('ada@example.com');
  });

  it('rejects profile image paths outside the current user’s fixed object keys', async () => {
    const { service, supabase } = setup();
    await expect(service.updateProfile(userId, { avatarPath: 'another-user/avatar' } as UpdateProfileDto))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('does not select billing or Stripe identifiers for the profile response', async () => {
    const { service, query } = setup();
    const result = await service.getProfile(userId);
    const selectedColumns = query.select.mock.calls[0][0] as string;
    expect(selectedColumns).toContain('tier');
    expect(selectedColumns).not.toContain('stripe_customer_id');
    expect(selectedColumns).not.toContain('stripe_subscription_id');
    expect(result.fullName).toBe('Ada Lovelace');
    expect(result.jobTitle).toBe('Engineer');
    expect(result.avatarUrl).toBe(`https://storage.test/sign/${userId}/avatar`);
    expect(result.companyLogoUrl).toBe(`https://storage.test/sign/${userId}/company-logo`);
    expect(result).not.toHaveProperty('stripe_customer_id');
  });
});
