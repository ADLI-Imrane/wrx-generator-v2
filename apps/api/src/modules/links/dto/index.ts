import {
  IsString,
  IsUrl,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateLinkDto {
  @ApiProperty({ example: 'https://example.com/very-long-url-that-needs-shortening' })
  @IsUrl()
  originalUrl!: string;

  @ApiPropertyOptional({ example: 'my-custom-slug', minLength: 3, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  slug?: string;

  @ApiPropertyOptional({ example: 'My Link Title' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'A description for this link' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ example: 'secretpassword' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxClicks?: number;
}

export class UpdateLinkDto extends PartialType(CreateLinkDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isActive?: boolean;
}
