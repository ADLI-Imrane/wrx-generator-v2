import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateQrDto, UpdateQrDto } from './dto';
import * as QRCode from 'qrcode';
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

@Injectable()
export class QrService {
  constructor(private supabaseService: SupabaseService) {}

  async create(userId: string, dto: CreateQrDto) {
    const supabase = this.supabaseService.getAdminClient();

    // Check user's tier and QR limits
    const userLimits = await this.checkUserLimits(userId);
    if (userLimits.qrCount >= userLimits.maxQrs) {
      throw new ForbiddenException('QR code limit reached for your plan');
    }

    // Generate QR code
    const qrOptions: QROptions = {
      width: dto.size || 256,
      margin: dto.margin || 2,
      color: {
        dark: dto.foregroundColor || '#000000',
        light: dto.backgroundColor || '#FFFFFF',
      },
      errorCorrectionLevel: dto.errorCorrectionLevel || 'M',
    };

    const qrDataUrl = await this.generateQrCode(dto.content, qrOptions);

    // Store in database
    const { data, error } = await supabase
      .from('qr_codes')
      .insert({
        user_id: userId,
        link_id: dto.linkId,
        content: dto.content,
        title: dto.title,
        description: dto.description,
        foreground_color: dto.foregroundColor || '#000000',
        background_color: dto.backgroundColor || '#FFFFFF',
        size: dto.size || 256,
        error_correction_level: dto.errorCorrectionLevel || 'M',
        logo_url: dto.logoUrl,
        style: dto.style || 'square',
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      ...data,
      qrDataUrl,
    };
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const supabase = this.supabaseService.getAdminClient();
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('qr_codes')
      .select('*, links(slug, original_url)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      data,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
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

    return data;
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
    if (dto.foregroundColor !== undefined) updateData['foreground_color'] = dto.foregroundColor;
    if (dto.backgroundColor !== undefined) updateData['background_color'] = dto.backgroundColor;
    if (dto.size !== undefined) updateData['size'] = dto.size;
    if (dto.logoUrl !== undefined) updateData['logo_url'] = dto.logoUrl;
    if (dto.style !== undefined) updateData['style'] = dto.style;

    const { data, error } = await supabase
      .from('qr_codes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
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

  async generateImage(userId: string, id: string, format: 'png' | 'svg' = 'png') {
    const qr = await this.findOne(userId, id);

    const qrOptions: QROptions = {
      width: qr.size,
      margin: 2,
      color: {
        dark: qr.foreground_color,
        light: qr.background_color,
      },
      errorCorrectionLevel: qr.error_correction_level as 'L' | 'M' | 'Q' | 'H',
    };

    if (format === 'svg') {
      return this.generateQrCodeSvg(qr.content, qrOptions);
    }

    return this.generateQrCode(qr.content, qrOptions);
  }

  async download(userId: string, id: string, format: 'png' | 'svg' = 'png') {
    const qr = await this.findOne(userId, id);
    const image = await this.generateImage(userId, id, format);

    // Increment download count
    const supabase = this.supabaseService.getAdminClient();
    await supabase
      .from('qr_codes')
      .update({ downloads_count: (qr.downloads_count || 0) + 1 })
      .eq('id', id);

    return {
      filename: `qr-${qr.id}.${format}`,
      content: image,
      contentType: format === 'svg' ? 'image/svg+xml' : 'image/png',
    };
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
