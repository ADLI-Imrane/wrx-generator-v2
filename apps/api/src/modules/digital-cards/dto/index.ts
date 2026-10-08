import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength, MinLength, Validate, ValidatorConstraint, type ValidatorConstraintInterface } from 'class-validator';
import type {
  CreateDigitalCardDto as CreateDigitalCardContract,
  DigitalCardDocumentV1,
  UpdateDigitalCardDto as UpdateDigitalCardContract,
} from '@wrx/shared';
import { parseDigitalCardDocument } from '@wrx/shared';

@ValidatorConstraint({ name: 'digitalCardDocument', async: false })
class DigitalCardDocumentConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    try {
      parseDigitalCardDocument(value);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'document must match the supported DigitalCardDocumentV1 schema.';
  }
}

export class CreateDigitalCardRequestDto implements CreateDigitalCardContract {
  @ApiProperty({ example: 'Carte de contact', maxLength: 100 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @ApiProperty({ description: 'Versioned and strictly validated DigitalCardDocumentV1.' })
  @IsObject()
  @Validate(DigitalCardDocumentConstraint)
  document!: DigitalCardDocumentV1;
}

export class UpdateDigitalCardRequestDto implements UpdateDigitalCardContract {
  @ApiProperty({ required: false, example: 'Carte de contact', maxLength: 100 })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @ApiProperty({ required: false, description: 'Replacement DigitalCardDocumentV1 snapshot.' })
  @IsOptional()
  @IsObject()
  @Validate(DigitalCardDocumentConstraint)
  document?: DigitalCardDocumentV1;
}
