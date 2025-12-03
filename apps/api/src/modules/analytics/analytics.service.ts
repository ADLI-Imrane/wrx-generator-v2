import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';

type TimeRange = '7d' | '30d' | '90d' | 'all';

@Injectable()
export class AnalyticsService {
  constructor(private supabaseService: SupabaseService) {}

  async getAnalytics(userId: string, timeRange: TimeRange = '30d') {
    const supabase = this.supabaseService.getAdminClient();

    // Calculate date range
    const now = new Date();
    let startDate: Date | null = null;

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = null;
        break;
    }

    // Get user's link IDs
    const { data: userLinks } = await supabase.from('links').select('id').eq('user_id', userId);
    const linkIds = userLinks?.map((l) => l.id) || [];

    // Get user's QR code IDs
    const { data: userQrCodes } = await supabase
      .from('qr_codes')
      .select('id')
      .eq('user_id', userId);
    const qrCodeIds = userQrCodes?.map((q) => q.id) || [];

    // Get total links count
    const { count: totalLinks } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get total QR codes count
    const { count: totalQrCodes } = await supabase
      .from('qr_codes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get clicks from clicks table
    let clicksQuery = supabase
      .from('clicks')
      .select('*')
      .in('link_id', linkIds.length > 0 ? linkIds : ['00000000-0000-0000-0000-000000000000']);

    if (startDate) {
      clicksQuery = clicksQuery.gte('clicked_at', startDate.toISOString());
    }

    const { data: clicksData } = await clicksQuery;
    const clicks = clicksData || [];

    // Get scans from scans table
    let scansQuery = supabase
      .from('scans')
      .select('*')
      .in(
        'qr_code_id',
        qrCodeIds.length > 0 ? qrCodeIds : ['00000000-0000-0000-0000-000000000000']
      );

    if (startDate) {
      scansQuery = scansQuery.gte('scanned_at', startDate.toISOString());
    }

    const { data: scansData } = await scansQuery;
    const scans = scansData || [];

    const totalClicks = clicks.length;
    const totalScans = scans.length;

    // Calculate clicks/scans by day
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 30;
    const clicksByDay = this.aggregateByDay(clicks, scans, days, now);

    // Get top links
    const { data: topLinksData } = await supabase
      .from('links')
      .select('id, title, slug, clicks')
      .eq('user_id', userId)
      .order('clicks', { ascending: false })
      .limit(5);

    const topLinks = (topLinksData || []).map((link) => ({
      id: link.id,
      title: link.title || link.slug,
      slug: link.slug,
      clicks: link.clicks || 0,
    }));

    // Get top QR codes
    const { data: topQrData } = await supabase
      .from('qr_codes')
      .select('id, title, type, scans_count')
      .eq('user_id', userId)
      .order('scans_count', { ascending: false })
      .limit(5);

    const topQrCodes = (topQrData || []).map((qr) => ({
      id: qr.id,
      name: qr.title || 'Sans titre',
      type: qr.type || 'url',
      scans: qr.scans_count || 0,
    }));

    // Aggregate by country
    const clicksByCountry = this.aggregateByField(clicks);

    // Aggregate by device
    const clicksByDevice = this.aggregateByDevice(clicks);

    // Aggregate by referrer
    const clicksByReferrer = this.aggregateByReferrer(clicks);

    // Calculate change percentages (compare with previous period)
    const { clicksChange, scansChange } = await this.calculateChanges(
      supabase,
      linkIds,
      qrCodeIds,
      startDate,
      totalClicks,
      totalScans
    );

    return {
      overview: {
        totalLinks: totalLinks || 0,
        totalQrCodes: totalQrCodes || 0,
        totalClicks,
        totalScans,
        clicksChange,
        scansChange,
      },
      clicksByDay,
      topLinks,
      topQrCodes,
      clicksByCountry,
      clicksByDevice,
      clicksByReferrer,
    };
  }

  private aggregateByDay(
    clicks: Array<{ clicked_at: string }>,
    scans: Array<{ scanned_at: string }>,
    days: number,
    now: Date
  ) {
    const result: Array<{ date: string; clicks: number; scans: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0] as string;

      const dayClicks = clicks.filter((c) => {
        const clickDate = new Date(c.clicked_at).toISOString().split('T')[0];
        return clickDate === dateStr;
      }).length;

      const dayScans = scans.filter((s) => {
        const scanDate = new Date(s.scanned_at).toISOString().split('T')[0];
        return scanDate === dateStr;
      }).length;

      result.push({ date: dateStr, clicks: dayClicks, scans: dayScans });
    }

    return result;
  }

  private aggregateByField(clicks: Array<{ country?: string; country_code?: string }>) {
    const countMap = new Map<string, { country: string; code: string; clicks: number }>();

    clicks.forEach((click) => {
      const name = click.country || 'Inconnu';
      const code = click.country_code || 'XX';

      if (countMap.has(name)) {
        countMap.get(name)!.clicks++;
      } else {
        countMap.set(name, { country: name, code, clicks: 1 });
      }
    });

    const result = Array.from(countMap.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    if (result.length === 0) {
      return [{ country: 'Aucune donnée', code: 'XX', clicks: 0 }];
    }

    return result;
  }

  private aggregateByDevice(clicks: Array<{ device?: string }>) {
    const countMap = new Map<string, number>();

    clicks.forEach((click) => {
      const device = click.device || 'Inconnu';
      countMap.set(device, (countMap.get(device) || 0) + 1);
    });

    const result = Array.from(countMap.entries())
      .map(([device, clicks]) => ({ device, clicks }))
      .sort((a, b) => b.clicks - a.clicks);

    if (result.length === 0) {
      return [
        { device: 'Mobile', clicks: 0 },
        { device: 'Desktop', clicks: 0 },
        { device: 'Tablet', clicks: 0 },
      ];
    }

    return result;
  }

  private aggregateByReferrer(clicks: Array<{ referrer?: string }>) {
    const countMap = new Map<string, number>();

    clicks.forEach((click) => {
      let referrer = 'Direct';

      if (click.referrer) {
        try {
          const url = new URL(click.referrer);
          const hostname = url.hostname.toLowerCase();

          if (hostname.includes('google')) referrer = 'Google';
          else if (hostname.includes('facebook') || hostname.includes('fb.')) referrer = 'Facebook';
          else if (hostname.includes('twitter') || hostname.includes('t.co')) referrer = 'Twitter';
          else if (hostname.includes('instagram')) referrer = 'Instagram';
          else if (hostname.includes('linkedin')) referrer = 'LinkedIn';
          else if (hostname.includes('youtube')) referrer = 'YouTube';
          else referrer = hostname;
        } catch {
          referrer = 'Autre';
        }
      }

      countMap.set(referrer, (countMap.get(referrer) || 0) + 1);
    });

    const result = Array.from(countMap.entries())
      .map(([referrer, clicks]) => ({ referrer, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    if (result.length === 0) {
      return [{ referrer: 'Aucune donnée', clicks: 0 }];
    }

    return result;
  }

  private async calculateChanges(
    supabase: ReturnType<SupabaseService['getAdminClient']>,
    linkIds: string[],
    qrCodeIds: string[],
    startDate: Date | null,
    currentClicks: number,
    currentScans: number
  ) {
    if (!startDate) {
      return { clicksChange: 0, scansChange: 0 };
    }

    const periodDays = Math.round((Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const previousStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const { data: prevClicksData } = await supabase
      .from('clicks')
      .select('id')
      .in('link_id', linkIds.length > 0 ? linkIds : ['00000000-0000-0000-0000-000000000000'])
      .gte('clicked_at', previousStartDate.toISOString())
      .lt('clicked_at', startDate.toISOString());

    const previousClicks = prevClicksData?.length || 0;

    const { data: prevScansData } = await supabase
      .from('scans')
      .select('id')
      .in('qr_code_id', qrCodeIds.length > 0 ? qrCodeIds : ['00000000-0000-0000-0000-000000000000'])
      .gte('scanned_at', previousStartDate.toISOString())
      .lt('scanned_at', startDate.toISOString());

    const previousScans = prevScansData?.length || 0;

    const clicksChange =
      previousClicks > 0
        ? Math.round(((currentClicks - previousClicks) / previousClicks) * 100 * 10) / 10
        : currentClicks > 0
          ? 100
          : 0;

    const scansChange =
      previousScans > 0
        ? Math.round(((currentScans - previousScans) / previousScans) * 100 * 10) / 10
        : currentScans > 0
          ? 100
          : 0;

    return { clicksChange, scansChange };
  }
}
