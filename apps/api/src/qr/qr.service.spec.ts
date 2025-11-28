import { Test, TestingModule } from '@nestjs/testing';
import { QrService } from './qr.service';
import { ConfigService } from '@nestjs/config';

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

describe('QrService', () => {
  let service: QrService;
  let mockSupabaseClient: MockSupabaseClient;

  const mockQRCode = {
    id: 'qr-1',
    user_id: 'user-1',
    title: 'Test QR',
    type: 'url',
    data: { url: 'https://example.com' },
    style: { foreground: '#000000', background: '#ffffff' },
    scans: 0,
    is_active: true,
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
        QrService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
              if (key === 'SUPABASE_SERVICE_KEY') return 'test-key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<QrService>(QrService);
    (service as unknown as { supabase: MockSupabaseClient }).supabase = mockSupabaseClient;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new QR code', async () => {
      const createDto = {
        title: 'Test QR',
        type: 'url' as const,
        data: { url: 'https://example.com' },
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockQRCode,
        error: null,
      });

      const result = await service.create('user-1', createDto);

      expect(result).toEqual(mockQRCode);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('qr_codes');
    });

    it('should throw error if creation fails', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        service.create('user-1', {
          title: 'Test',
          type: 'url' as const,
          data: { url: 'https://example.com' },
        })
      ).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return paginated QR codes', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: [mockQRCode],
        error: null,
        count: 1,
      });

      const result = await service.findAll('user-1', { page: 1, limit: 10 });

      expect(result.data).toEqual([mockQRCode]);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a single QR code', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: mockQRCode,
        error: null,
      });

      const result = await service.findOne('user-1', 'qr-1');

      expect(result).toEqual(mockQRCode);
    });

    it('should throw NotFoundException if QR code not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(service.findOne('user-1', 'non-existent')).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update a QR code', async () => {
      const updatedQR = { ...mockQRCode, title: 'Updated QR' };
      mockSupabaseClient.single.mockResolvedValue({
        data: updatedQR,
        error: null,
      });

      const result = await service.update('user-1', 'qr-1', {
        title: 'Updated QR',
      });

      expect(result.title).toBe('Updated QR');
    });
  });

  describe('remove', () => {
    it('should delete a QR code', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        error: null,
      });

      await expect(service.remove('user-1', 'qr-1')).resolves.not.toThrow();
    });
  });

  describe('generateQRImage', () => {
    it('should generate QR code image as data URL', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: mockQRCode,
        error: null,
      });

      const result = await service.generateQRImage('user-1', 'qr-1', {
        format: 'png',
        size: 256,
      });

      expect(result).toContain('data:image/png;base64,');
    });

    it('should generate SVG QR code', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: mockQRCode,
        error: null,
      });

      const result = await service.generateQRImage('user-1', 'qr-1', {
        format: 'svg',
        size: 256,
      });

      expect(result).toContain('<svg');
    });
  });

  describe('incrementScans', () => {
    it('should increment scan count', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: { ...mockQRCode, scans: 1 },
        error: null,
      });

      await expect(service.incrementScans('qr-1')).resolves.not.toThrow();
    });
  });
});
