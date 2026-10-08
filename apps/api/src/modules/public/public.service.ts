import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  GoneException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { isSafeLinkDestination } from '../links/link-destination';
import { promisify } from 'node:util';
import { scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

const scrypt = promisify(scryptCallback);

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

interface ResolvableLinkRow {
  id: string;
  original_url: string;
  is_active: boolean;
  expires_at: string | null;
  max_clicks: number | null;
  clicks: number | null;
  password_hash: string | null;
  title: string | null;
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

    await this.assertLinkCanResolve(link, password);

    // Record the click
    await this.recordClick({
      ...clickData,
      linkId: link.id,
    });

    return {
      url: link.original_url,
      title: link.title,
    };
  }

  /** Managed QR ingress shares every Link policy but intentionally records no ordinary click. */
  async resolveManagedQr(linkId: string, password?: string) {
    const { data: link, error } = await this.supabaseService
      .getAdminClient()
      .from('links')
      .select('*')
      .eq('id', linkId)
      .maybeSingle();

    if (error || !link) throw new NotFoundException('Link not found');
    await this.assertLinkCanResolve(link, password);
    return { url: link.original_url, title: link.title };
  }

  private async assertLinkCanResolve(link: ResolvableLinkRow, password?: string): Promise<void> {
    if (!link.is_active) throw new GoneException('This link has been deactivated');
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      throw new GoneException('This link has expired');
    }
    if (link.max_clicks && (await this.getAcceptedRouteCount(link)) >= Number(link.max_clicks)) {
      throw new GoneException('This link has reached its maximum number of clicks');
    }
    if (!isSafeLinkDestination(link.original_url)) {
      throw new GoneException('This link destination is unavailable');
    }
    if (link.password_hash) {
      if (!password) throw new UnauthorizedException('This link is password protected');
      if (!(await this.verifyPassword(password, link.password_hash))) {
        throw new ForbiddenException('Invalid password');
      }
    }
  }

  private async getAcceptedRouteCount(link: ResolvableLinkRow): Promise<number> {
    const supabase = this.supabaseService.getAdminClient();
    const qrResult = await supabase
      .from('qr_codes')
      .select('id')
      .eq('link_id', link.id)
      .eq('routing_mode', 'managed_link');
    if (qrResult.error) throw qrResult.error;

    const qrIds = (qrResult.data || []).map((qr: { id: string }) => qr.id);
    if (qrIds.length === 0) return Number(link.clicks || 0);

    const scanResult = await supabase
      .from('scans')
      .select('id', { count: 'exact', head: true })
      .in('qr_code_id', qrIds);
    if (scanResult.error) throw scanResult.error;
    return Number(link.clicks || 0) + (scanResult.count || 0);
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

    const { error } = await supabase.from('clicks').insert({
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
    if (error) throw error;
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const [algorithm, salt, storedKey] = hash.split('$');
    if (algorithm !== 'scrypt' || !salt || !storedKey) return false;

    const computedKey = (await scrypt(password, salt, 64)) as Buffer;
    const expectedKey = Buffer.from(storedKey, 'hex');
    return expectedKey.length === computedKey.length && timingSafeEqual(expectedKey, computedKey);
  }
}
