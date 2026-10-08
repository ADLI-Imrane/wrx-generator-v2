import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import type {
  CreateEmailSignatureDto as CreateEmailSignatureContract,
  EmailSignatureDocumentV1,
  UpdateEmailSignatureDto as UpdateEmailSignatureContract,
} from '@wrx/shared';
import { parseEmailSignatureDocument } from '@wrx/shared';

@ValidatorConstraint({ name: 'emailSignatureDocument', async: false })
class EmailSignatureDocumentConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    try {
      parseEmailSignatureDocument(value);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'document must match the supported EmailSignatureDocumentV1 schema.';
  }
}

export class CreateEmailSignatureRequestDto implements CreateEmailSignatureContract {
  @ApiProperty({ example: 'Primary work signature', maxLength: 100 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @ApiProperty({ description: 'Strictly validated versioned EmailSignatureDocumentV1.' })
  @IsObject()
  @Validate(EmailSignatureDocumentConstraint)
  document!: EmailSignatureDocumentV1;
}

export class UpdateEmailSignatureRequestDto implements UpdateEmailSignatureContract {
  @ApiPropertyOptional({ example: 'Work signature', maxLength: 100 })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ description: 'Replacement EmailSignatureDocumentV1 snapshot.' })
  @IsOptional()
  @IsObject()
  @Validate(EmailSignatureDocumentConstraint)
  document?: EmailSignatureDocumentV1;
}
