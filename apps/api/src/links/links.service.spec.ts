import { Test, TestingModule } from '@nestjs/testing';
import { LinksService } from './links.service';
import { ConfigService } from '@nestjs/config';

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'abc123'),
}));

interface MockSupabaseClient {
  from: jest.Mock;
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  range: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
}

describe('LinksService', () => {
  let service: LinksService;
  let mockSupabaseClient: MockSupabaseClient;

  const mockLink = {
    id: 'link-1',
    user_id: 'user-1',
    original_url: 'https://example.com',
    short_code: 'abc123',
    title: 'Test Link',
    clicks: 0,
    is_active: true,
    expires_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(async () => {
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    } as unknown as MockSupabaseClient;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinksService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
              if (key === 'SUPABASE_SERVICE_KEY') return 'test-key';
              if (key === 'APP_URL') return 'https://wrx.io';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<LinksService>(LinksService);
    // Replace the supabase client with our mock
    (service as unknown as { supabase: MockSupabaseClient }).supabase = mockSupabaseClient;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new link', async () => {
      const createDto = {
        original_url: 'https://example.com',
        title: 'Test Link',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockLink,
        error: null,
      });

      const result = await service.create('user-1', createDto);

      expect(result).toEqual(mockLink);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('links');
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should throw error if creation fails', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        service.create('user-1', { original_url: 'https://example.com' })
      ).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return paginated links', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: [mockLink],
        error: null,
        count: 1,
      });

      const result = await service.findAll('user-1', { page: 1, limit: 10 });

      expect(result.data).toEqual([mockLink]);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a single link', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: mockLink,
        error: null,
      });

      const result = await service.findOne('user-1', 'link-1');

      expect(result).toEqual(mockLink);
    });

    it('should throw NotFoundException if link not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(service.findOne('user-1', 'non-existent')).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update a link', async () => {
      const updatedLink = { ...mockLink, title: 'Updated Title' };
      mockSupabaseClient.single.mockResolvedValue({
        data: updatedLink,
        error: null,
      });

      const result = await service.update('user-1', 'link-1', {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
    });
  });

  describe('remove', () => {
    it('should delete a link', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        error: null,
      });

      await expect(service.remove('user-1', 'link-1')).resolves.not.toThrow();
    });
  });

  describe('findByShortCode', () => {
    it('should find link by short code', async () => {
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: mockLink,
        error: null,
      });

      const result = await service.findByShortCode('abc123');

      expect(result).toEqual(mockLink);
    });

    it('should return null if not found', async () => {
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await service.findByShortCode('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('incrementClicks', () => {
    it('should increment click count', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: { ...mockLink, clicks: 1 },
        error: null,
      });

      await expect(service.incrementClicks('link-1')).resolves.not.toThrow();
    });
  });
});
