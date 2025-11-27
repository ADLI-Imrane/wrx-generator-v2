import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  GoneException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';

interface ClickData {
  linkId: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
}

@Injectable()
export class PublicService {
  constructor(private supabaseService: SupabaseService) {}

  async redirect(slug: string, clickData: ClickData, password?: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Find the link
    const { data: link, error } = await supabase
      .from('links')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !link) {
      throw new NotFoundException('Link not found');
    }

    // Check if link is active
    if (!link.is_active) {
      throw new GoneException('This link has been deactivated');
    }

    // Check expiration
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      throw new GoneException('This link has expired');
    }

    // Check max clicks
    if (link.max_clicks && link.clicks_count >= link.max_clicks) {
      throw new GoneException('This link has reached its maximum number of clicks');
    }

    // Check password protection
    if (link.password_hash) {
      if (!password) {
        throw new UnauthorizedException('This link is password protected');
      }
      const isValidPassword = await this.verifyPassword(password, link.password_hash);
      if (!isValidPassword) {
        throw new ForbiddenException('Invalid password');
      }
    }

    // Record the click
    await this.recordClick({
      ...clickData,
      linkId: link.id,
    });

    // Increment click count
    await supabase
      .from('links')
      .update({ clicks_count: link.clicks_count + 1 })
      .eq('id', link.id);

    return {
      url: link.original_url,
      title: link.title,
    };
  }

  async getLinkPreview(slug: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data: link, error } = await supabase
      .from('links')
      .select('slug, title, description, is_active, expires_at')
      .eq('slug', slug)
      .single();

    if (error || !link) {
      throw new NotFoundException('Link not found');
    }

    if (!link.is_active) {
      throw new GoneException('This link has been deactivated');
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      throw new GoneException('This link has expired');
    }

    return {
      slug: link.slug,
      title: link.title,
      description: link.description,
    };
  }

  async checkPassword(slug: string, password: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data: link, error } = await supabase
      .from('links')
      .select('password_hash')
      .eq('slug', slug)
      .single();

    if (error || !link) {
      throw new NotFoundException('Link not found');
    }

    if (!link.password_hash) {
      return { valid: true };
    }

    const isValid = await this.verifyPassword(password, link.password_hash);
    return { valid: isValid };
  }

  private async recordClick(data: ClickData) {
    const supabase = this.supabaseService.getAdminClient();

    await supabase.from('clicks').insert({
      link_id: data.linkId,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      referrer: data.referrer,
      country: data.country,
      city: data.city,
      device: data.device,
      browser: data.browser,
      os: data.os,
    });
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return computedHash === hash;
  }
}
