import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  assertDigitalCardAssetsOwned,
  assertDigitalCardPublishable,
  DigitalCardDocumentValidationError,
  normalizeDigitalCardTitle,
  parseDigitalCardDocument,
  type CreateDigitalCardDto,
  type DigitalCardDocumentV1,
  type DigitalCardRecord,
  type DigitalCardStatus,
  type PublicDigitalCard,
  type UpdateDigitalCardDto,
} from '@wrx/shared';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { DIGITAL_CARD_SLUG_COLLISION_ATTEMPTS, DigitalCardSlugGenerator } from './digital-card-slug';

const DIGITAL_CARD_COLUMNS =
  'id,user_id,title,slug,status,schema_version,document,created_at,updated_at,published_at';
const PUBLIC_ASSET_URL_TTL_SECONDS = 300;
const PUBLIC_SLUG_CONSTRAINT = 'digital_cards_slug_unique';

interface DigitalCardRow {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  status: string;
  schema_version: number;
  document: unknown;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface DatabaseError {
  code?: string;
  constraint?: string;
  message?: string;
}

@Injectable()
export class DigitalCardsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly slugGenerator: DigitalCardSlugGenerator
  ) {}

  async list(userId: string): Promise<DigitalCardRecord[]> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('digital_cards')
      .select(DIGITAL_CARD_COLUMNS)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error || !data) throw new InternalServerErrorException('Unable to load Digital Cards');
    return data.map((row) => this.toRecord(row as unknown as DigitalCardRow));
  }

  async findOne(userId: string, id: string): Promise<DigitalCardRecord> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('digital_cards')
      .select(DIGITAL_CARD_COLUMNS)
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new InternalServerErrorException('Unable to load Digital Card');
    if (!data) throw new NotFoundException('Digital Card not found');
    return this.toRecord(data as unknown as DigitalCardRow);
  }

  async create(userId: string, dto: CreateDigitalCardDto): Promise<DigitalCardRecord> {
    const title = this.parseTitle(dto.title);
    const document = this.parseDocument(dto.document, userId);
    const admin = this.supabaseService.getAdminClient();

    for (let attempt = 0; attempt < DIGITAL_CARD_SLUG_COLLISION_ATTEMPTS; attempt += 1) {
      const slug = this.slugGenerator.generate();
      const { data, error } = await admin
        .from('digital_cards')
        .insert({
          user_id: userId,
          title,
          slug,
          status: 'draft',
          schema_version: document.schemaVersion,
          document,
          published_at: null,
        })
        .select(DIGITAL_CARD_COLUMNS)
        .single();

      if (!error && data) return this.toRecord(data as unknown as DigitalCardRow);
      if (this.isSlugCollision(error)) continue;
      throw new InternalServerErrorException('Unable to create Digital Card');
    }

    throw new ConflictException('Unable to allocate a unique Digital Card URL; please retry');
  }

  async update(userId: string, id: string, dto: UpdateDigitalCardDto): Promise<DigitalCardRecord> {
    const current = await this.findOne(userId, id);
    const update: Record<string, unknown> = {};

    if (dto.title !== undefined) update['title'] = this.parseTitle(dto.title);
    if (dto.document !== undefined) {
      update['document'] = this.parseDocument(dto.document, userId);
    }
    if (Object.keys(update).length === 0) {
      throw new BadRequestException('At least one editable field is required');
    }

    const nextDocument = (update['document'] as DigitalCardDocumentV1 | undefined) ?? current.document;
    if (current.status === 'published') this.assertPublishable(nextDocument);

    // Compare the state observed above so a concurrent draft publication cannot
    // race with an incomplete draft update and leave that document public.
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('digital_cards')
      .update(update)
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', current.status)
      .eq('updated_at', current.updatedAt)
      .select(DIGITAL_CARD_COLUMNS)
      .maybeSingle();

    if (error) throw new InternalServerErrorException('Unable to update Digital Card');
    if (!data) throw new ConflictException('Digital Card changed; reload it and retry');
    return this.toRecord(data as unknown as DigitalCardRow);
  }

  async remove(userId: string, id: string): Promise<{ id: string; deleted: true }> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('digital_cards')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();

    if (error) throw new InternalServerErrorException('Unable to delete Digital Card');
    if (!data) throw new NotFoundException('Digital Card not found');
    return { id: data.id as string, deleted: true };
  }

  async publish(userId: string, id: string): Promise<DigitalCardRecord> {
    const current = await this.findOne(userId, id);
    if (current.status === 'published') return current;
    this.assertPublishable(current.document);

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('digital_cards')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'draft')
      .eq('updated_at', current.updatedAt)
      .select(DIGITAL_CARD_COLUMNS)
      .maybeSingle();

    if (error) throw new InternalServerErrorException('Unable to publish Digital Card');
    if (data) return this.toRecord(data as unknown as DigitalCardRow);

    const latest = await this.findOne(userId, id);
    if (latest.status === 'published') return latest;
    throw new ConflictException('Digital Card changed; review it and publish again');
  }

  async unpublish(userId: string, id: string): Promise<DigitalCardRecord> {
    const current = await this.findOne(userId, id);
    if (current.status === 'draft') return current;

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('digital_cards')
      .update({ status: 'draft', published_at: null })
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'published')
      .select(DIGITAL_CARD_COLUMNS)
      .maybeSingle();

    if (error) throw new InternalServerErrorException('Unable to unpublish Digital Card');
    if (data) return this.toRecord(data as unknown as DigitalCardRow);

    const latest = await this.findOne(userId, id);
    if (latest.status === 'draft') return latest;
    throw new ConflictException('Digital Card changed; reload it and retry');
  }

  async findPublished(slug: string): Promise<PublicDigitalCard> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('digital_cards')
      .select(DIGITAL_CARD_COLUMNS)
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error) throw new InternalServerErrorException('Unable to resolve Digital Card');
    if (!data) throw new NotFoundException('Digital Card not found');

    const record = this.toRecord(data as unknown as DigitalCardRow);
    this.assertPublishable(record.document);
    return this.toPublicProjection(record);
  }

  private async toPublicProjection(record: DigitalCardRecord): Promise<PublicDigitalCard> {
    const { document } = record;
    const { identity, contact, socialLinks, visibility } = document;
    const signAsset = async (path: string | null, visible: boolean): Promise<string | undefined> => {
      if (!path || !visible) return undefined;
      // The document has already been checked against the owner folder by toRecord.
      const { data, error } = await this.supabaseService
        .getAdminClient()
        .storage.from('avatars')
        .createSignedUrl(path, PUBLIC_ASSET_URL_TTL_SECONDS);
      return error ? undefined : data.signedUrl;
    };

    const [avatarUrl, companyLogoUrl] = await Promise.all([
      signAsset(identity.avatarPath, visibility.avatar),
      signAsset(identity.companyLogoPath, visibility.companyLogo),
    ]);

    const publicIdentity: PublicDigitalCard['identity'] = {
      fullName: identity.fullName,
      ...(visibility.jobTitle && identity.jobTitle ? { jobTitle: identity.jobTitle } : {}),
      ...(visibility.company && identity.company ? { company: identity.company } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
      ...(companyLogoUrl ? { companyLogoUrl } : {}),
    };
    const publicContact: PublicDigitalCard['contact'] = {
      ...(visibility.email && contact.email ? { email: contact.email } : {}),
      ...(visibility.phone && contact.phone ? { phone: contact.phone } : {}),
      ...(visibility.website && contact.website ? { website: contact.website } : {}),
      ...(visibility.address && contact.address ? { address: contact.address } : {}),
    };
    const publicSocialLinks: PublicDigitalCard['socialLinks'] = {
      ...(visibility.linkedin && socialLinks.linkedin ? { linkedin: socialLinks.linkedin } : {}),
      ...(visibility.github && socialLinks.github ? { github: socialLinks.github } : {}),
      ...(visibility.instagram && socialLinks.instagram ? { instagram: socialLinks.instagram } : {}),
      ...(visibility.x && socialLinks.x ? { x: socialLinks.x } : {}),
    };

    return {
      slug: record.slug,
      identity: publicIdentity,
      contact: publicContact,
      socialLinks: publicSocialLinks,
      brand: document.brand,
      presentation: document.presentation,
    };
  }

  private parseTitle(value: unknown): string {
    try {
      return normalizeDigitalCardTitle(value);
    } catch (error) {
      if (error instanceof DigitalCardDocumentValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private parseDocument(value: unknown, userId: string): DigitalCardDocumentV1 {
    try {
      const document = parseDigitalCardDocument(value);
      assertDigitalCardAssetsOwned(document, userId);
      return document;
    } catch (error) {
      if (error instanceof DigitalCardDocumentValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private assertPublishable(document: DigitalCardDocumentV1): void {
    try {
      assertDigitalCardPublishable(document);
    } catch (error) {
      if (error instanceof DigitalCardDocumentValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private isSlugCollision(error: DatabaseError | null): boolean {
    if (error?.code !== '23505') return false;
    const constraint = `${error.constraint ?? ''} ${error.message ?? ''}`;
    return constraint.includes(PUBLIC_SLUG_CONSTRAINT);
  }

  private toRecord(row: DigitalCardRow): DigitalCardRecord {
    try {
      const document = parseDigitalCardDocument(row.document);
      if (
        row.schema_version !== document.schemaVersion ||
        !/^[a-f0-9]{32}$/.test(row.slug) ||
        !['draft', 'published'].includes(row.status) ||
        (row.status === 'draft' && row.published_at !== null) ||
        (row.status === 'published' && !row.published_at)
      ) {
        throw new Error('Stored Digital Card metadata does not match its document');
      }
      assertDigitalCardAssetsOwned(document, row.user_id);
      return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        slug: row.slug,
        status: row.status as DigitalCardStatus,
        schemaVersion: document.schemaVersion,
        document,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        publishedAt: row.published_at,
      };
    } catch {
      throw new InternalServerErrorException('Stored Digital Card document is invalid');
    }
  }
}
