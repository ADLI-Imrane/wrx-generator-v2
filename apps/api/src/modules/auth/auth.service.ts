import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { LoginDto, RegisterDto, RefreshTokenDto, UpdateProfileDto } from './dto';
import type { UserProfile } from '@wrx/shared';

const PROFILE_COLUMNS = {
  fullName: 'full_name',
  avatarPath: 'avatar_path',
  jobTitle: 'job_title',
  company: 'company',
  phone: 'phone',
  website: 'website',
  address: 'address',
  linkedinUrl: 'linkedin_url',
  githubUrl: 'github_url',
  instagramUrl: 'instagram_url',
  xUrl: 'x_url',
  companyLogoPath: 'company_logo_path',
  primaryBrandColor: 'primary_brand_color',
  secondaryBrandColor: 'secondary_brand_color',
} as const;

const PROFILE_SELECT = [
  'id', 'email', 'full_name', 'avatar_url', 'avatar_path', 'job_title', 'company', 'phone',
  'website', 'address', 'linkedin_url', 'github_url', 'instagram_url', 'x_url',
  'company_logo_path', 'primary_brand_color', 'secondary_brand_color', 'tier',
  'created_at', 'updated_at',
].join(',');

@Injectable()
export class AuthService {
  constructor(private supabaseService: SupabaseService) {}

  async register(dto: RegisterDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: {
          full_name: dto.fullName,
        },
      },
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  async login(dto: LoginDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  async logout(accessToken: string) {
    const supabase = this.supabaseService.getClientForUser(accessToken);

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'Logged out successfully' };
  }

  async refreshToken(dto: RefreshTokenDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: dto.refreshToken,
    });

    if (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      session: data.session,
    };
  }

  async getProfile(userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', userId)
      .single();

    if (error) {
      throw new BadRequestException('Profile not found');
    }

    return this.toProfileDto(data as unknown as Record<string, unknown>);
  }

  async updateProfile(userId: string, updates: UpdateProfileDto) {
    const supabase = this.supabaseService.getAdminClient();
    const profileUpdates: Record<string, string | null> = {};

    for (const [key, column] of Object.entries(PROFILE_COLUMNS)) {
      const value = updates[key as keyof UpdateProfileDto];
      if (value !== undefined) profileUpdates[column] = value as string | null;
    }

    if (updates.avatarPath && updates.avatarPath !== `${userId}/avatar`) {
      throw new BadRequestException('Avatar path must belong to the current user');
    }
    if (updates.companyLogoPath && updates.companyLogoPath !== `${userId}/company-logo`) {
      throw new BadRequestException('Logo path must belong to the current user');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profileUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select(PROFILE_SELECT)
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return this.toProfileDto(data as unknown as Record<string, unknown>);
  }

  private async toProfileDto(row: Record<string, unknown>): Promise<UserProfile> {
    const supabase = this.supabaseService.getAdminClient();
    const stringValue = (key: string) => typeof row[key] === 'string' ? row[key] as string : undefined;
    const legacyAvatarUrl = stringValue('avatar_url');
    const legacyAvatarPath = this.getAvatarObjectPath(legacyAvatarUrl);
    const signImage = async (path: unknown) => {
      if (typeof path !== 'string') return undefined;
      const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, 3600);
      return error ? undefined : data.signedUrl;
    };
    const [storedAvatarUrl, companyLogoUrl] = await Promise.all([
      signImage(row['avatar_path'] ?? legacyAvatarPath),
      signImage(row['company_logo_path']),
    ]);

    return {
      id: stringValue('id') ?? '',
      email: stringValue('email') ?? '',
      fullName: stringValue('full_name'),
      avatarUrl: storedAvatarUrl ?? (legacyAvatarPath ? undefined : legacyAvatarUrl),
      jobTitle: stringValue('job_title'),
      company: stringValue('company'),
      phone: stringValue('phone'),
      website: stringValue('website'),
      address: stringValue('address'),
      linkedinUrl: stringValue('linkedin_url'),
      githubUrl: stringValue('github_url'),
      instagramUrl: stringValue('instagram_url'),
      xUrl: stringValue('x_url'),
      companyLogoUrl,
      primaryBrandColor: stringValue('primary_brand_color'),
      secondaryBrandColor: stringValue('secondary_brand_color'),
      tier: stringValue('tier') as UserProfile['tier'],
      createdAt: stringValue('created_at') ?? '',
      updatedAt: stringValue('updated_at') ?? '',
    };
  }

  private getAvatarObjectPath(url?: string): string | undefined {
    if (!url) return undefined;
    try {
      const pathname = new URL(url).pathname;
      const match = pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/avatars\/(.+)$/);
      return match?.[1] ? decodeURIComponent(match[1]) : undefined;
    } catch {
      return undefined;
    }
  }
}
