import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import {
  EmailSignatureDocumentValidationError,
  getEmailSignatureImageAssetIds,
  normalizeEmailSignatureImageKind,
  normalizeEmailSignatureTitle,
  parseEmailSignatureDocument,
  type CreateEmailSignatureDto,
  type EmailSignatureAssetRecord,
  type EmailSignatureDocumentV1,
  type EmailSignatureImageKind,
  type EmailSignatureRecord,
  type UpdateEmailSignatureDto,
} from '@wrx/shared';
import { SupabaseService } from '../../common/supabase/supabase.service';

export const EMAIL_SIGNATURE_ASSET_BUCKET = 'email-signature-assets';
export const EMAIL_SIGNATURE_IMAGE_MAX_BYTES = 1_048_576;
const SIGNATURE_COLUMNS = 'id,user_id,title,schema_version,document,created_at,updated_at';
const ASSET_COLUMNS = 'id,user_id,object_path,kind,content_type,byte_size,created_at';
const PROFILE_IMAGE_PATHS = {
  avatar: 'avatar_path',
  'company-logo': 'company_logo_path',
} as const;

interface SignatureRow {
  id: string;
  user_id: string;
  title: string;
  schema_version: number;
  document: unknown;
  created_at: string;
  updated_at: string;
}

interface AssetRow {
  id: string;
  user_id: string;
  object_path: string;
  kind: EmailSignatureImageKind;
  content_type: 'image/png' | 'image/jpeg';
  byte_size: number;
  created_at: string;
}

interface ImageInput {
  buffer: Buffer;
  size: number;
  mimetype: string;
}

@Injectable()
export class EmailSignaturesService {
  private readonly logger = new Logger(EmailSignaturesService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async list(userId: string): Promise<EmailSignatureRecord[]> {
    const { data, error } = await this.supabaseService.getAdminClient()
      .from('email_signatures').select(SIGNATURE_COLUMNS).eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error || !data) throw new InternalServerErrorException('Unable to load Email Signatures');
    return data.map((row) => this.toRecord(row as unknown as SignatureRow));
  }

  async findOne(userId: string, id: string): Promise<EmailSignatureRecord> {
    const { data, error } = await this.supabaseService.getAdminClient()
      .from('email_signatures').select(SIGNATURE_COLUMNS).eq('id', id).eq('user_id', userId).maybeSingle();
    if (error) throw new InternalServerErrorException('Unable to load Email Signature');
    if (!data) throw new NotFoundException('Email Signature not found');
    return this.toRecord(data as unknown as SignatureRow);
  }

  async create(userId: string, dto: CreateEmailSignatureDto): Promise<EmailSignatureRecord> {
    const title = this.parseTitle(dto.title);
    const document = this.parseDocument(dto.document);
    await this.assertAssetsOwned(userId, document);
    const { data, error } = await this.supabaseService.getAdminClient()
      .from('email_signatures').insert({
        user_id: userId,
        title,
        schema_version: document.schemaVersion,
        document,
      }).select(SIGNATURE_COLUMNS).single();
    if (error || !data) throw new InternalServerErrorException('Unable to create Email Signature');
    return this.toRecord(data as unknown as SignatureRow);
  }

  async update(userId: string, id: string, dto: UpdateEmailSignatureDto): Promise<EmailSignatureRecord> {
    const update: Record<string, unknown> = {};
    if (dto.title !== undefined) update['title'] = this.parseTitle(dto.title);
    if (dto.document !== undefined) {
      const document = this.parseDocument(dto.document);
      await this.assertAssetsOwned(userId, document);
      update['document'] = document;
      update['schema_version'] = document.schemaVersion;
    }
    if (!Object.keys(update).length) throw new BadRequestException('At least one editable field is required');
    const { data, error } = await this.supabaseService.getAdminClient()
      .from('email_signatures').update(update).eq('id', id).eq('user_id', userId)
      .select(SIGNATURE_COLUMNS).maybeSingle();
    if (error) throw new InternalServerErrorException('Unable to update Email Signature');
    if (!data) throw new NotFoundException('Email Signature not found');
    return this.toRecord(data as unknown as SignatureRow);
  }

  async remove(userId: string, id: string): Promise<{ id: string; deleted: true }> {
    const { data, error } = await this.supabaseService.getAdminClient()
      .from('email_signatures').delete().eq('id', id).eq('user_id', userId).select('id').maybeSingle();
    if (error) throw new InternalServerErrorException('Unable to delete Email Signature');
    if (!data) throw new NotFoundException('Email Signature not found');
    // Asset rows intentionally remain; their owner may remove them once no signature references them.
    return { id: data.id as string, deleted: true };
  }

  async listAssets(userId: string): Promise<EmailSignatureAssetRecord[]> {
    const { data, error } = await this.supabaseService.getAdminClient()
      .from('email_signature_assets').select(ASSET_COLUMNS).eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) throw new InternalServerErrorException('Unable to load Email Signature images');
    return Promise.all(data.map((row) => this.toAssetRecord(row as unknown as AssetRow)));
  }

  async uploadAsset(userId: string, file: ImageInput, rawKind: unknown): Promise<EmailSignatureAssetRecord> {
    const validated = this.validateImage(file);
    return this.storeAsset(userId, validated.buffer, validated.contentType, validated.byteSize, this.parseKind(rawKind));
  }

  async copyProfileAsset(userId: string, rawKind: unknown): Promise<EmailSignatureAssetRecord> {
    const kind = this.parseKind(rawKind);
    const column = PROFILE_IMAGE_PATHS[kind];
    const admin = this.supabaseService.getAdminClient();
    const { data: profile, error: profileError } = await admin.from('profiles')
      .select(column).eq('id', userId).maybeSingle();
    if (profileError) throw new InternalServerErrorException('Unable to load Profile image');
    const path = (profile as Record<string, unknown> | null)?.[column];
    const expectedPath = kind === 'avatar' ? `${userId}/avatar` : `${userId}/company-logo`;
    if (typeof path !== 'string' || path !== expectedPath) {
      throw new NotFoundException('No private Profile image is available to publish');
    }

    const { data: blob, error } = await admin.storage.from('avatars').download(path);
    if (error || !blob) throw new NotFoundException('Private Profile image could not be read');
    if (blob.size > EMAIL_SIGNATURE_IMAGE_MAX_BYTES) {
      throw new PayloadTooLargeException('Email Signature images must be 1 MiB or smaller');
    }
    const buffer = Buffer.from(await blob.arrayBuffer());
    const sniffed = this.sniffRaster(buffer);
    const suppliedType = blob.type?.toLowerCase();
    if (!sniffed || suppliedType !== sniffed.contentType) {
      throw new BadRequestException('Profile image must be a PNG or JPEG supported by email clients');
    }
    return this.storeAsset(userId, buffer, sniffed.contentType, buffer.byteLength, kind);
  }

  async removeAsset(userId: string, id: string): Promise<{ id: string; deleted: true }> {
    const admin = this.supabaseService.getAdminClient();
    const { data: found, error: findError } = await admin.from('email_signature_assets')
      .select(ASSET_COLUMNS).eq('id', id).eq('user_id', userId).maybeSingle();
    if (findError) throw new InternalServerErrorException('Unable to load Email Signature image');
    if (!found) throw new NotFoundException('Email Signature image not found');
    const asset = found as unknown as AssetRow;

    // Deleting the metadata first is an atomic reference check: the migration's RESTRICT FK
    // rejects this while any saved document references the asset. New references then fail FK.
    const { data: removed, error: deleteError } = await admin.from('email_signature_assets')
      .delete().eq('id', id).eq('user_id', userId).select('id').maybeSingle();
    if (deleteError?.code === '23503') {
      throw new ConflictException('This image is used by a saved Email Signature; replace it before deleting');
    }
    if (deleteError) throw new InternalServerErrorException('Unable to remove Email Signature image');
    if (!removed) throw new NotFoundException('Email Signature image not found');

    const { error: storageError } = await admin.storage.from(EMAIL_SIGNATURE_ASSET_BUCKET).remove([asset.object_path]);
    if (storageError) {
      const { error: restoreError } = await admin.from('email_signature_assets').insert({
        id: asset.id,
        user_id: asset.user_id,
        object_path: asset.object_path,
        kind: asset.kind,
        content_type: asset.content_type,
        byte_size: asset.byte_size,
        created_at: asset.created_at,
      });
      if (restoreError) this.logger.error(`Failed to restore asset metadata after storage removal error (${id})`);
      throw new InternalServerErrorException('Image removal did not complete; retry from the image library');
    }
    return { id, deleted: true };
  }

  private async storeAsset(
    userId: string,
    buffer: Buffer,
    contentType: 'image/png' | 'image/jpeg',
    byteSize: number,
    kind: EmailSignatureImageKind
  ): Promise<EmailSignatureAssetRecord> {
    const extension = contentType === 'image/png' ? 'png' : 'jpg';
    const objectPath = `v1/${randomBytes(32).toString('hex')}.${extension}`;
    const admin = this.supabaseService.getAdminClient();
    this.assertHttpsPublicUrl(admin.storage.from(EMAIL_SIGNATURE_ASSET_BUCKET).getPublicUrl(objectPath).data.publicUrl);
    const { error: storageError } = await admin.storage.from(EMAIL_SIGNATURE_ASSET_BUCKET)
      .upload(objectPath, buffer, { contentType, cacheControl: '0', upsert: false });
    if (storageError) throw new InternalServerErrorException('Unable to publish Email Signature image');

    const { data, error } = await admin.from('email_signature_assets').insert({
      user_id: userId,
      object_path: objectPath,
      kind,
      content_type: contentType,
      byte_size: byteSize,
    }).select(ASSET_COLUMNS).single();
    if (error || !data) {
      const { error: cleanupError } = await admin.storage.from(EMAIL_SIGNATURE_ASSET_BUCKET).remove([objectPath]);
      if (cleanupError) this.logger.error('Orphaned Email Signature upload cleanup failed after metadata insert error');
      throw new InternalServerErrorException('Unable to register Email Signature image');
    }
    return this.toAssetRecord(data as unknown as AssetRow);
  }

  private validateImage(file: ImageInput): {
    buffer: Buffer;
    contentType: 'image/png' | 'image/jpeg';
    byteSize: number;
  } {
    if (!file || !Buffer.isBuffer(file.buffer)) throw new BadRequestException('An image file is required');
    if (file.size < 1 || file.size > EMAIL_SIGNATURE_IMAGE_MAX_BYTES || file.buffer.byteLength !== file.size) {
      throw new PayloadTooLargeException('Email Signature images must be between 1 byte and 1 MiB');
    }
    const sniffed = this.sniffRaster(file.buffer);
    if (!sniffed || file.mimetype?.toLowerCase() !== sniffed.contentType) {
      throw new BadRequestException('Only valid PNG and JPEG images are supported');
    }
    return { buffer: file.buffer, contentType: sniffed.contentType, byteSize: file.size };
  }

  private sniffRaster(buffer: Buffer): { contentType: 'image/png' | 'image/jpeg' } | null {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (buffer.length >= png.length && buffer.subarray(0, png.length).equals(png)) {
      let offset = 8;
      let hasHeader = false;
      let hasImageData = false;
      while (offset + 12 <= buffer.length) {
        const length = buffer.readUInt32BE(offset);
        const end = offset + length + 12;
        if (end > buffer.length) return null;
        const type = buffer.toString('ascii', offset + 4, offset + 8);
        if (!hasHeader) {
          if (type !== 'IHDR' || length !== 13) return null;
          const width = buffer.readUInt32BE(offset + 8);
          const height = buffer.readUInt32BE(offset + 12);
          if (!this.safeDimensions(width, height)) return null;
          hasHeader = true;
        }
        if (type === 'acTL') return null;
        if (type === 'IDAT' && length > 0) hasImageData = true;
        if (type === 'IEND') {
          return length === 0 && end === buffer.length && hasHeader && hasImageData
            ? { contentType: 'image/png' }
            : null;
        }
        offset = end;
      }
      return null;
    }

    if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      let offset = 2;
      let hasFrame = false;
      while (offset < buffer.length - 2) {
        if (buffer[offset] !== 0xff) return null;
        while (buffer[offset] === 0xff) offset += 1;
        const marker = buffer[offset++];
        if (marker === undefined) return null;
        if (marker === 0xd9) return null;
        if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
        if (offset + 2 > buffer.length) return null;
        const segmentLength = buffer.readUInt16BE(offset);
        if (segmentLength < 2 || offset + segmentLength > buffer.length) return null;
        const isFrame = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);
        if (isFrame) {
          if (segmentLength < 8) return null;
          const height = buffer.readUInt16BE(offset + 3);
          const width = buffer.readUInt16BE(offset + 5);
          if (!this.safeDimensions(width, height)) return null;
          hasFrame = true;
        }
        const isScan = marker === 0xda;
        offset += segmentLength;
        if (isScan) {
          const endsWithEoi = buffer.length >= 2 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9;
          return hasFrame && endsWithEoi ? { contentType: 'image/jpeg' } : null;
        }
      }
    }
    return null;
  }

  private safeDimensions(width: number, height: number): boolean {
    return width > 0 && height > 0 && width <= 8192 && height <= 8192 && width * height <= 12_000_000;
  }

  private async assertAssetsOwned(userId: string, document: EmailSignatureDocumentV1): Promise<void> {
    const ids = getEmailSignatureImageAssetIds(document);
    if (!ids.length) return;
    const { data, error } = await this.supabaseService.getAdminClient().from('email_signature_assets')
      .select('id,kind').eq('user_id', userId).in('id', ids);
    if (error || !data || data.length !== ids.length) {
      throw new BadRequestException('Every Email Signature image must be published and owned by the current user');
    }
    const byId = new Map((data as Array<{ id: string; kind: EmailSignatureImageKind }>).map((asset) => [asset.id, asset.kind]));
    if (
      (document.images.avatar && byId.get(document.images.avatar.assetId) !== 'avatar') ||
      (document.images.companyLogo && byId.get(document.images.companyLogo.assetId) !== 'company-logo')
    ) {
      throw new BadRequestException('Email Signature image role does not match its published asset');
    }
  }

  private parseTitle(value: unknown): string {
    try { return normalizeEmailSignatureTitle(value); }
    catch (error) {
      if (error instanceof EmailSignatureDocumentValidationError) throw new BadRequestException(error.message);
      throw error;
    }
  }

  private parseDocument(value: unknown): EmailSignatureDocumentV1 {
    try { return parseEmailSignatureDocument(value); }
    catch (error) {
      if (error instanceof EmailSignatureDocumentValidationError) throw new BadRequestException(error.message);
      throw error;
    }
  }

  private parseKind(value: unknown): EmailSignatureImageKind {
    try { return normalizeEmailSignatureImageKind(value); }
    catch (error) {
      if (error instanceof EmailSignatureDocumentValidationError) throw new BadRequestException(error.message);
      throw error;
    }
  }

  private toRecord(row: SignatureRow): EmailSignatureRecord {
    try {
      const document = parseEmailSignatureDocument(row.document);
      if (row.schema_version !== document.schemaVersion) throw new Error('Version mismatch');
      return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        schemaVersion: document.schemaVersion,
        document,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch {
      throw new InternalServerErrorException('Stored Email Signature document is invalid');
    }
  }

  private toAssetRecord(row: AssetRow): EmailSignatureAssetRecord {
    const { data } = this.supabaseService.getAdminClient().storage.from(EMAIL_SIGNATURE_ASSET_BUCKET)
      .getPublicUrl(row.object_path);
    this.assertHttpsPublicUrl(data.publicUrl);
    return {
      id: row.id,
      kind: row.kind,
      contentType: row.content_type,
      byteSize: row.byte_size,
      publicUrl: data.publicUrl,
      createdAt: row.created_at,
    };
  }

  private assertHttpsPublicUrl(value: string): void {
    let publicUrl: URL;
    try { publicUrl = new URL(value); }
    catch { throw new InternalServerErrorException('Email Signature image URL is invalid'); }
    if (publicUrl.protocol !== 'https:') {
      throw new InternalServerErrorException('Email Signature images require an HTTPS Supabase project URL');
    }
  }
}
