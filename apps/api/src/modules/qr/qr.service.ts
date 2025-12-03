import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateQrDto, UpdateQrDto } from './dto';
import * as QRCode from 'qrcode';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import PDFDocument = require('pdfkit');
import { TIER_LIMITS } from '@wrx/shared';

export interface QROptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

// Database row type for QR codes
interface QRCodeRow {
  id: string;
  user_id: string;
  link_id?: string;
  type: string;
  title?: string;
  description?: string;
  content: string;
  image_url?: string;
  foreground_color?: string;
  background_color?: string;
  size?: number;
  margin?: number;
  logo_url?: string;
  style?: string;
  scans_count?: number;
  downloads_count?: number;
  error_correction_level?: string;
  created_at: string;
  updated_at?: string;
  links?: unknown;
}

// Helper to transform snake_case DB response to camelCase
function transformQRCode(data: QRCodeRow): Record<string, unknown> {
  return {
    id: data.id,
    userId: data.user_id,
    linkId: data.link_id,
    type: data.type,
    title: data.title,
    description: data.description,
    content: data.content,
    imageUrl: data.image_url,
    foregroundColor: data.foreground_color,
    backgroundColor: data.background_color,
    size: data.size,
    margin: data.margin,
    logoUrl: data.logo_url,
    style: {
      foregroundColor: data.foreground_color,
      backgroundColor: data.background_color,
      style: data.style,
      logoUrl: data.logo_url,
      size: data.size,
      margin: data.margin,
    },
    scans: data.scans_count,
    downloads: data.downloads_count,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    links: data.links,
  };
}

@Injectable()
export class QrService {
  private apiUrl: string;

  constructor(
    private supabaseService: SupabaseService,
    private configService: ConfigService
  ) {
    this.apiUrl = this.configService.get<string>('API_URL') || 'http://localhost:3000';
  }

  async create(userId: string, dto: CreateQrDto) {
    const supabase = this.supabaseService.getAdminClient();

    // Check user's tier and QR limits
    const userLimits = await this.checkUserLimits(userId);
    if (userLimits.qrCount >= userLimits.maxQrs) {
      throw new ForbiddenException('QR code limit reached for your plan');
    }

    // Extract style properties
    const styleConfig = dto.style || {};

    // Store in database FIRST to get the ID
    const { data, error } = await supabase
      .from('qr_codes')
      .insert({
        user_id: userId,
        link_id: dto.linkId,
        type: dto.type || 'url',
        content: dto.content,
        title: dto.title,
        description: dto.description,
        foreground_color: styleConfig.foregroundColor || '#000000',
        background_color: styleConfig.backgroundColor || '#FFFFFF',
        size: styleConfig.size || 256,
        margin: styleConfig.margin || 2,
        logo_url: styleConfig.logoUrl,
        style: styleConfig.style || 'squares',
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    // Generate QR code with tracking URL
    const trackingUrl = `${this.apiUrl}/r/scan/${data.id}`;

    const qrOptions: QROptions = {
      width: styleConfig.size || 256,
      margin: styleConfig.margin || 2,
      color: {
        dark: styleConfig.foregroundColor || '#000000',
        light: styleConfig.backgroundColor || '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    };

    const qrDataUrl = await this.generateQrCode(trackingUrl, qrOptions);

    return {
      ...transformQRCode(data),
      imageUrl: qrDataUrl,
    };
  }

  async findAll(
    userId: string,
    page = 1,
    limit = 20,
    filters: { search?: string; type?: string; sortBy?: string; sortOrder?: string } = {}
  ) {
    const supabase = this.supabaseService.getAdminClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('qr_codes')
      .select('*, links(slug, original_url)', { count: 'exact' })
      .eq('user_id', userId);

    // Apply search filter
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    // Apply type filter
    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    // Apply sorting
    const sortColumn =
      filters.sortBy === 'scans'
        ? 'scans_count'
        : filters.sortBy === 'title'
          ? 'title'
          : 'created_at';
    const ascending = filters.sortOrder === 'asc';
    query = query.order(sortColumn, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new BadRequestException(error.message);
    }

    // Generate QR code image for each item
    const qrCodesWithImages = await Promise.all(
      ((data as unknown as QRCodeRow[]) || []).map(async (qr) => {
        const transformed = transformQRCode(qr);
        // Generate QR code image on the fly
        const trackingUrl = `${this.apiUrl}/r/scan/${qr.id}`;
        const qrOptions: QROptions = {
          width: qr.size || 256,
          margin: qr.margin || 2,
          color: {
            dark: qr.foreground_color || '#000000',
            light: qr.background_color || '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        };
        try {
          const imageUrl = await this.generateQrCode(trackingUrl, qrOptions);
          return { ...transformed, imageUrl };
        } catch {
          return transformed;
        }
      })
    );

    return {
      data: qrCodesWithImages,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async findOne(userId: string, id: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('qr_codes')
      .select('*, links(slug, original_url)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('QR code not found');
    }

    const qr = data as unknown as QRCodeRow;
    const transformed = transformQRCode(qr);

    // Generate QR code image on the fly
    const trackingUrl = `${this.apiUrl}/r/scan/${qr.id}`;
    const qrOptions: QROptions = {
      width: qr.size || 256,
      margin: qr.margin || 2,
      color: {
        dark: qr.foreground_color || '#000000',
        light: qr.background_color || '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    };

    try {
      const imageUrl = await this.generateQrCode(trackingUrl, qrOptions);
      return { ...transformed, imageUrl };
    } catch {
      return transformed;
    }
  }

  async update(userId: string, id: string, dto: UpdateQrDto) {
    const supabase = this.supabaseService.getAdminClient();

    // Verify ownership
    await this.findOne(userId, id);

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) updateData['title'] = dto.title;
    if (dto.description !== undefined) updateData['description'] = dto.description;
    if (dto.content !== undefined) updateData['content'] = dto.content;
    if (dto.type !== undefined) updateData['type'] = dto.type;

    // Handle style properties
    if (dto.style) {
      if (dto.style.foregroundColor !== undefined)
        updateData['foreground_color'] = dto.style.foregroundColor;
      if (dto.style.backgroundColor !== undefined)
        updateData['background_color'] = dto.style.backgroundColor;
      if (dto.style.size !== undefined) updateData['size'] = dto.style.size;
      if (dto.style.logoUrl !== undefined) updateData['logo_url'] = dto.style.logoUrl;
      if (dto.style.style !== undefined) updateData['style'] = dto.style.style;
      if (dto.style.margin !== undefined) updateData['margin'] = dto.style.margin;
    }

    const { data, error } = await supabase
      .from('qr_codes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return transformQRCode(data as unknown as QRCodeRow);
  }

  async remove(userId: string, id: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Verify ownership
    await this.findOne(userId, id);

    const { error } = await supabase.from('qr_codes').delete().eq('id', id);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'QR code deleted successfully' };
  }

  // Find QR code by ID without ownership check (for public scan tracking)
  async findById(id: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase.from('qr_codes').select('*').eq('id', id).single();

    if (error || !data) {
      throw new NotFoundException('QR code not found');
    }

    return data as unknown as QRCodeRow;
  }

  // Track QR code scan (public, no auth required)
  async trackScan(
    id: string,
    scanData: {
      ipAddress?: string;
      userAgent?: string;
      device?: string;
      browser?: string;
      os?: string;
    }
  ) {
    const supabase = this.supabaseService.getAdminClient();

    // Get QR code
    const qr = await this.findById(id);

    // Record scan in scans table
    await supabase.from('scans').insert({
      qr_code_id: id,
      ip_address: scanData.ipAddress,
      user_agent: scanData.userAgent,
      device: scanData.device,
      browser: scanData.browser,
      os: scanData.os,
    });

    // Increment scan count
    const currentScans = qr.scans_count || 0;
    await supabase
      .from('qr_codes')
      .update({ scans_count: currentScans + 1 })
      .eq('id', id);

    // Return the content/URL to redirect to
    return {
      content: qr.content,
      type: qr.type,
    };
  }

  async generateImage(userId: string, id: string, format: 'png' | 'svg' = 'png') {
    const qr = await this.findOne(userId, id);

    // Use tracking URL instead of direct content
    const trackingUrl = `${this.apiUrl}/r/scan/${qr['id']}`;

    const qrOptions: QROptions = {
      width: (qr['size'] as number) || 256,
      margin: 2,
      color: {
        dark: (qr['foregroundColor'] as string) || '#000000',
        light: (qr['backgroundColor'] as string) || '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    };

    if (format === 'svg') {
      return this.generateQrCodeSvg(trackingUrl, qrOptions);
    }

    return this.generateQrCode(trackingUrl, qrOptions);
  }

  async download(userId: string, id: string, format: 'png' | 'svg' | 'pdf' = 'png') {
    const qr = await this.findOne(userId, id);

    // For PDF, we need to generate PNG first then convert
    const imageFormat = format === 'pdf' ? 'png' : format;
    const image = await this.generateImage(userId, id, imageFormat);

    // Increment download count
    const supabase = this.supabaseService.getAdminClient();
    const currentDownloads = (qr['downloads'] as number) || 0;
    await supabase
      .from('qr_codes')
      .update({ downloads_count: currentDownloads + 1 })
      .eq('id', id);

    if (format === 'pdf') {
      // Generate simple PDF with embedded QR code
      const qrSize = (qr['size'] as number) || 256;
      const pdfContent = await this.generatePdf(image, qrSize);
      return {
        filename: `qr-${qr['id']}.pdf`,
        content: pdfContent,
        contentType: 'application/pdf',
      };
    }

    return {
      filename: `qr-${qr['id']}.${format}`,
      content: image,
      contentType: format === 'svg' ? 'image/svg+xml' : 'image/png',
    };
  }

  private async generatePdf(qrDataUrl: string, size: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // Create PDF document (A4 size)
        const doc = new PDFDocument({ size: 'A4', margin: 0 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Convert base64 data URL to buffer
        const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Calculate centered position
        const pageWidth = 595.28; // A4 width in points
        const pageHeight = 841.89; // A4 height in points
        const qrSize = Math.min(size, 400); // Max QR size in PDF
        const x = (pageWidth - qrSize) / 2;
        const y = (pageHeight - qrSize) / 2;

        // Add QR code image only (centered)
        doc.image(imageBuffer, x, y, { width: qrSize, height: qrSize });

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async generateQrCode(content: string, options: QROptions): Promise<string> {
    try {
      return await QRCode.toDataURL(content, options);
    } catch {
      throw new BadRequestException('Failed to generate QR code');
    }
  }

  private async generateQrCodeSvg(content: string, options: QROptions): Promise<string> {
    try {
      return await QRCode.toString(content, { ...options, type: 'svg' });
    } catch {
      throw new BadRequestException('Failed to generate QR code SVG');
    }
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

    // Count user's QR codes
    const { count } = await supabase
      .from('qr_codes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      qrCount: count || 0,
      maxQrs: limits.maxQRCodes,
      tier,
    };
  }
}
