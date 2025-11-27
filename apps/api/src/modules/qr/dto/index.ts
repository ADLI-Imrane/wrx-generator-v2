import {
  IsString,
  IsUrl,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsHexColor,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateQrDto {
  @ApiProperty({ example: 'https://wrx.link/abc123' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: 'Link ID to associate with this QR code' })
  @IsOptional()
  @IsUUID()
  linkId?: string;

  @ApiPropertyOptional({ example: 'My QR Code' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'A description for this QR code' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: '#000000' })
  @IsOptional()
  @IsHexColor()
  foregroundColor?: string;

  @ApiPropertyOptional({ example: '#FFFFFF' })
  @IsOptional()
  @IsHexColor()
  backgroundColor?: string;

  @ApiPropertyOptional({ example: 256, minimum: 64, maximum: 2048 })
  @IsOptional()
  @IsInt()
  @Min(64)
  @Max(2048)
  size?: number;

  @ApiPropertyOptional({ example: 2, minimum: 0, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  margin?: number;

  @ApiPropertyOptional({ example: 'M', enum: ['L', 'M', 'Q', 'H'] })
  @IsOptional()
  @IsIn(['L', 'M', 'Q', 'H'])
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'square', enum: ['square', 'rounded', 'dots'] })
  @IsOptional()
  @IsIn(['square', 'rounded', 'dots'])
  style?: 'square' | 'rounded' | 'dots';
}

export class UpdateQrDto extends PartialType(CreateQrDto) {}
