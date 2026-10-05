import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProfileDto } from './index';

describe('UpdateProfileDto', () => {
  async function errorsFor(payload: Record<string, unknown>) {
    const dto = plainToInstance(UpdateProfileDto, payload);
    return validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  }

  it('normalizes optional text, URLs, and colors', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      fullName: '  Ada Lovelace  ',
      website: ' example.com/profile ',
      linkedinUrl: '',
      primaryBrandColor: '#235ee7',
      secondaryBrandColor: '  ',
    });

    expect(dto.fullName).toBe('Ada Lovelace');
    expect(dto.website).toBe('https://example.com/profile');
    expect(dto.linkedinUrl).toBeNull();
    expect(dto.primaryBrandColor).toBe('#235EE7');
    expect(dto.secondaryBrandColor).toBeNull();
    expect(await validate(dto)).toHaveLength(0);
  });

  it('allows all optional identity values to be cleared', async () => {
    const errors = await errorsFor({
      fullName: '', jobTitle: '', company: '', phone: '', website: '', address: '',
      linkedinUrl: '', githubUrl: '', instagramUrl: '', xUrl: '',
      primaryBrandColor: '', secondaryBrandColor: '', avatarPath: '', companyLogoPath: '',
    });
    expect(errors).toHaveLength(0);
  });

  it.each(['email', 'tier', 'subscription_tier', 'stripe_customer_id', 'stripe_subscription_id', 'id'])(
    'rejects protected or non-editable field %s', async (field) => {
      const errors = await errorsFor({ [field]: 'attacker-controlled' });
      expect(errors.some((error) => error.property === field)).toBe(true);
    }
  );

  it('rejects unsafe URLs, invalid phone values, and malformed colors', async () => {
    const errors = await errorsFor({
      website: 'javascript:alert(1)',
      phone: 'call-me-maybe',
      primaryBrandColor: 'blue',
    });
    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining([
      'website', 'phone', 'primaryBrandColor',
    ]));
  });

  it('rejects oversized optional text', async () => {
    const errors = await errorsFor({ company: 'a'.repeat(151) });
    expect(errors.some((error) => error.property === 'company')).toBe(true);
  });
});
