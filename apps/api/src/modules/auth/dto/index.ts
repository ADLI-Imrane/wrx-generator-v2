import { IsEmail, IsString, MinLength, IsOptional, MaxLength, IsUrl, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import type { UserProfileUpdate } from '@wrx/shared';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  fullName?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class UpdateProfileDto implements UserProfileUpdate {
  @ApiPropertyOptional({ example: 'John Doe', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Transform(({ value }) => normalizeOptionalText(value))
  fullName?: string | null;

  @ApiPropertyOptional({ example: 'user-id/avatar' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => normalizeOptionalText(value))
  avatarPath?: string | null;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => normalizeOptionalText(value))
  jobTitle?: string | null;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Transform(({ value }) => normalizeOptionalText(value))
  company?: string | null;

  @ApiPropertyOptional({ example: '+1 555 123 4567' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[+()\d.\-\s]{7,32}$/)
  @Transform(({ value }) => normalizeOptionalText(value))
  phone?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @Transform(({ value }) => normalizeOptionalUrl(value))
  website?: string | null;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Transform(({ value }) => normalizeOptionalText(value))
  address?: string | null;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @Transform(({ value }) => normalizeOptionalUrl(value))
  linkedinUrl?: string | null;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @Transform(({ value }) => normalizeOptionalUrl(value))
  githubUrl?: string | null;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @Transform(({ value }) => normalizeOptionalUrl(value))
  instagramUrl?: string | null;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @Transform(({ value }) => normalizeOptionalUrl(value))
  xUrl?: string | null;

  @ApiPropertyOptional({ example: 'user-id/company-logo' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => normalizeOptionalText(value))
  companyLogoPath?: string | null;

  @ApiPropertyOptional({ example: '#235EE7' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  @Transform(({ value }) => normalizeColor(value))
  primaryBrandColor?: string | null;

  @ApiPropertyOptional({ example: '#2E7352' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  @Transform(({ value }) => normalizeColor(value))
  secondaryBrandColor?: string | null;
}

function normalizeOptionalText(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return value.trim() || null;
}

function normalizeOptionalUrl(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function normalizeColor(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}
