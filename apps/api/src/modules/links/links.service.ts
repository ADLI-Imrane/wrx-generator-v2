import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateLinkDto, UpdateLinkDto } from './dto';
import { generateSlug } from '@wrx/shared';
import { SLUG_CONSTRAINTS, TIER_LIMITS } from '@wrx/shared';

// Transform snake_case DB response to camelCase for frontend
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformLink(dbLink: any) {
  const shortUrlDomain = process.env['SHORT_URL_DOMAIN'] || 'http://localhost:3000';
  return {
    id: dbLink.id,
    userId: dbLink.user_id,
    slug: dbLink.slug,
    originalUrl: dbLink.original_url,
    shortUrl: `${shortUrlDomain}/r/${dbLink.slug}`,
    title: dbLink.title,
    description: dbLink.description,
    passwordHash: dbLink.password_hash,
    expiresAt: dbLink.expires_at,
    maxClicks: dbLink.max_clicks,
    clicks: dbLink.clicks || 0,
    isActive: dbLink.is_active,
    tags: dbLink.tags || [],
    createdAt: dbLink.created_at,
    updatedAt: dbLink.updated_at,
  };
}

@Injectable()
export class LinksService {
  constructor(private supabaseService: SupabaseService) {}

  async create(userId: string, dto: CreateLinkDto) {
    const supabase = this.supabaseService.getAdminClient();

    // Check user's tier and link limits
    const userLimits = await this.checkUserLimits(userId);
    if (userLimits.linksCount >= userLimits.maxLinks) {
      throw new ForbiddenException('Link limit reached for your plan');
    }

    // Generate or validate slug
    let slug = dto.slug;
    if (slug) {
      // Validate custom slug
      if (slug.length < SLUG_CONSTRAINTS.minLength || slug.length > SLUG_CONSTRAINTS.maxLength) {
        throw new BadRequestException(
          `Slug must be between ${SLUG_CONSTRAINTS.minLength} and ${SLUG_CONSTRAINTS.maxLength} characters`
        );
      }
      if (!SLUG_CONSTRAINTS.pattern.test(slug)) {
        throw new BadRequestException('Slug can only contain letters, numbers, and hyphens');
      }

      // Check if slug is available
      const { data: existing } = await supabase
        .from('links')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        throw new BadRequestException('This slug is already taken');
      }
    } else {
      // Generate unique slug
      slug = await this.generateUniqueSlug();
    }

    const { data, error } = await supabase
      .from('links')
      .insert({
        user_id: userId,
        original_url: dto.originalUrl,
        slug,
        title: dto.title,
        description: dto.description,
        expires_at: dto.expiresAt,
        password_hash: dto.password ? await this.hashPassword(dto.password) : null,
        max_clicks: dto.maxClicks,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return transformLink(data);
  }

  async findAll(
    userId: string,
    page = 1,
    limit = 20,
    filters: { search?: string; isActive?: boolean; sortBy?: string; sortOrder?: string } = {}
  ) {
    const supabase = this.supabaseService.getAdminClient();
    const offset = (page - 1) * limit;

    let query = supabase.from('links').select('*', { count: 'exact' }).eq('user_id', userId);

    // Apply search filter
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,slug.ilike.%${filters.search}%,original_url.ilike.%${filters.search}%`
      );
    }

    // Apply isActive filter
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    // Apply sorting
    const sortColumn =
      filters.sortBy === 'clicks' ? 'clicks' : filters.sortBy === 'title' ? 'title' : 'created_at';
    const ascending = filters.sortOrder === 'asc';
    query = query.order(sortColumn, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      data: (data || []).map(transformLink),
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async findOne(userId: string, id: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Link not found');
    }

    return transformLink(data);
  }

  async update(userId: string, id: string, dto: UpdateLinkDto) {
    const supabase = this.supabaseService.getAdminClient();

    // Verify ownership
    await this.findOne(userId, id);

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) updateData['title'] = dto.title;
    if (dto.description !== undefined) updateData['description'] = dto.description;
    if (dto.originalUrl !== undefined) updateData['original_url'] = dto.originalUrl;
    if (dto.expiresAt !== undefined) updateData['expires_at'] = dto.expiresAt;
    if (dto.maxClicks !== undefined) updateData['max_clicks'] = dto.maxClicks;
    if (dto.isActive !== undefined) updateData['is_active'] = dto.isActive;

    const { data, error } = await supabase
      .from('links')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return transformLink(data);
  }

  async remove(userId: string, id: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Verify ownership
    await this.findOne(userId, id);

    const { error } = await supabase.from('links').delete().eq('id', id);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'Link deleted successfully' };
  }

  async getStats(userId: string, id: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Verify ownership
    const link = await this.findOne(userId, id);

    // Get click analytics
    const { data: clicks, error } = await supabase
      .from('clicks')
      .select('*')
      .eq('link_id', id)
      .order('clicked_at', { ascending: false })
      .limit(100);

    if (error) {
      throw new BadRequestException(error.message);
    }

    // Aggregate stats
    const stats = {
      totalClicks: link.clicks,
      uniqueClicks: new Set(clicks?.map((c) => c.ip_address)).size,
      recentClicks: clicks,
      byCountry: this.aggregateBy(clicks || [], 'country'),
      byDevice: this.aggregateBy(clicks || [], 'device'),
      byBrowser: this.aggregateBy(clicks || [], 'browser'),
      byReferrer: this.aggregateBy(clicks || [], 'referrer'),
    };

    return stats;
  }

  private aggregateBy(
    clicks: Array<Record<string, unknown>>,
    field: string
  ): Record<string, number> {
    return clicks.reduce((acc: Record<string, number>, click) => {
      const value = (click[field] as string) || 'Unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private async generateUniqueSlug(): Promise<string> {
    const supabase = this.supabaseService.getAdminClient();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const slug = generateSlug();
      const { data: existing } = await supabase
        .from('links')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!existing) {
        return slug;
      }
      attempts++;
    }

    throw new BadRequestException('Unable to generate unique slug');
  }

  private async checkUserLimits(userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Get user profile with tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', userId)
      .single();

    const tier = (profile?.tier as keyof typeof TIER_LIMITS) || 'free';
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

    // Count user's links
    const { count } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      linksCount: count || 0,
      maxLinks: limits.maxLinks,
      tier,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    // In production, use bcrypt or argon2
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}
