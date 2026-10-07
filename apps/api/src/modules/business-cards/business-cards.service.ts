import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  BUSINESS_CARD_SCHEMA_VERSION,
  BusinessCardDocumentValidationError,
  assertBusinessCardAssetsOwned,
  normalizeBusinessCardTitle,
  parseBusinessCardDocument,
  type BusinessCardDocument,
  type BusinessCardRecord,
  type CreateBusinessCardDto,
  type UpdateBusinessCardDto,
} from '@wrx/shared';
import { SupabaseService } from '../../common/supabase/supabase.service';

const BUSINESS_CARD_COLUMNS =
  'id,user_id,title,template_key,schema_version,document,created_at,updated_at';

interface BusinessCardRow {
  id: string;
  user_id: string;
  title: string;
  template_key: string;
  schema_version: number;
  document: unknown;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class BusinessCardsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async list(userId: string): Promise<BusinessCardRecord[]> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('business_cards')
      .select(BUSINESS_CARD_COLUMNS)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error || !data) throw new InternalServerErrorException('Unable to load business cards');
    return data.map((row) => this.toRecord(row as unknown as BusinessCardRow));
  }

  async findOne(userId: string, id: string): Promise<BusinessCardRecord> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('business_cards')
      .select(BUSINESS_CARD_COLUMNS)
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) throw new NotFoundException('Business card not found');
    return this.toRecord(data as unknown as BusinessCardRow);
  }

  async create(userId: string, dto: CreateBusinessCardDto): Promise<BusinessCardRecord> {
    const title = this.parseTitle(dto.title);
    const document = this.parseDocument(dto.document, userId);
    await this.assertManagedQrOwned(document, userId);

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('business_cards')
      .insert({
        user_id: userId,
        title,
        template_key: document.templateKey,
        schema_version: document.schemaVersion,
        document,
      })
      .select(BUSINESS_CARD_COLUMNS)
      .single();

    if (error || !data) throw new InternalServerErrorException('Unable to save business card');
    return this.toRecord(data as unknown as BusinessCardRow);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateBusinessCardDto
  ): Promise<BusinessCardRecord> {
    const update: Record<string, unknown> = {};
    if (dto.title !== undefined) update['title'] = this.parseTitle(dto.title);
    if (dto.document !== undefined) {
      const document = this.parseDocument(dto.document, userId);
      await this.assertManagedQrOwned(document, userId);
      update['document'] = document;
      update['template_key'] = document.templateKey;
      update['schema_version'] = document.schemaVersion;
    }
    if (Object.keys(update).length === 0) {
      throw new BadRequestException('At least one editable field is required');
    }

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('business_cards')
      .update(update)
      .eq('id', id)
      .eq('user_id', userId)
      .select(BUSINESS_CARD_COLUMNS)
      .maybeSingle();

    if (error) throw new InternalServerErrorException('Unable to update business card');
    if (!data) throw new NotFoundException('Business card not found');
    return this.toRecord(data as unknown as BusinessCardRow);
  }

  async remove(userId: string, id: string): Promise<{ id: string; deleted: true }> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('business_cards')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();

    if (error) throw new InternalServerErrorException('Unable to delete business card');
    if (!data) throw new NotFoundException('Business card not found');
    return { id: data.id as string, deleted: true };
  }

  private parseTitle(value: unknown): string {
    try {
      return normalizeBusinessCardTitle(value);
    } catch (error) {
      if (error instanceof BusinessCardDocumentValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private parseDocument(value: unknown, userId: string): BusinessCardDocument {
    try {
      const document = parseBusinessCardDocument(value);
      assertBusinessCardAssetsOwned(document, userId);
      return document;
    } catch (error) {
      if (error instanceof BusinessCardDocumentValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private async assertManagedQrOwned(
    document: BusinessCardDocument,
    userId: string
  ): Promise<void> {
    if (document.qr?.mode !== 'managed') return;

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('qr_codes')
      .select('id')
      .eq('id', document.qr.qrCodeId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data)
      throw new BadRequestException('Selected QR code is not owned by the current user');
  }

  private toRecord(row: BusinessCardRow): BusinessCardRecord {
    try {
      const document = parseBusinessCardDocument(row.document);
      if (
        row.schema_version !== BUSINESS_CARD_SCHEMA_VERSION ||
        row.schema_version !== document.schemaVersion ||
        row.template_key !== document.templateKey
      ) {
        throw new Error('Stored card metadata does not match its document');
      }
      assertBusinessCardAssetsOwned(document, row.user_id);
      return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        templateKey: document.templateKey,
        schemaVersion: document.schemaVersion,
        document,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch {
      throw new InternalServerErrorException('Stored business card document is invalid');
    }
  }
}
