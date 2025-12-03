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
  ValidateNested,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QRStyleConfigDto {
  @ApiPropertyOptional({ example: '#000000' })
  @IsOptional()
  @IsHexColor()
  foregroundColor?: string;

  @ApiPropertyOptional({ example: '#FFFFFF' })
  @IsOptional()
  @IsHexColor()
  backgroundColor?: string;

  @ApiPropertyOptional({ example: 'squares', enum: ['squares', 'rounded', 'dots'] })
  @IsOptional()
  @IsIn(['squares', 'rounded', 'dots'])
  style?: 'squares' | 'rounded' | 'dots';

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(200)
  logoSize?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  margin?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  cornerRadius?: number;

  @ApiPropertyOptional({ example: 256, minimum: 64, maximum: 2048 })
  @IsOptional()
  @IsInt()
  @Min(64)
  @Max(2048)
  size?: number;
}

export class CreateQrDto {
  @ApiProperty({ example: 'url', enum: ['url', 'vcard', 'wifi', 'text', 'email', 'phone', 'sms'] })
  @IsIn(['url', 'vcard', 'wifi', 'text', 'email', 'phone', 'sms'])
  type!: 'url' | 'vcard' | 'wifi' | 'text' | 'email' | 'phone' | 'sms';

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

  @ApiPropertyOptional({ type: QRStyleConfigDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => QRStyleConfigDto)
  style?: QRStyleConfigDto;
}

export class UpdateQrDto extends PartialType(CreateQrDto) {}
