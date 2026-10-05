import { Transform } from 'class-transformer';
import {
  IsObject,
  IsString,
  MaxLength,
  MinLength,
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  parseBusinessCardDocument,
  type BusinessCardDocument,
  type CreateBusinessCardDto as CreateBusinessCardContract,
  type UpdateBusinessCardDto as UpdateBusinessCardContract,
} from '@wrx/shared';

@ValidatorConstraint({ name: 'businessCardDocument', async: false })
class BusinessCardDocumentConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    try {
      parseBusinessCardDocument(value);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'document must match the supported BusinessCardDocument schema.';
  }
}

export class CreateBusinessCardRequestDto implements CreateBusinessCardContract {
  @ApiProperty({ example: 'My business card', maxLength: 100 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @ApiProperty({ description: 'Versioned, structured BusinessCardDocument V1.' })
  @IsObject()
  @Validate(BusinessCardDocumentConstraint)
  document!: BusinessCardDocument;
}

export class UpdateBusinessCardRequestDto
  extends PartialType(CreateBusinessCardRequestDto)
  implements UpdateBusinessCardContract {}

// Explicit type alias keeps controller/service signatures aligned with the shared contract.
export type BusinessCardDocumentRequest = BusinessCardDocument;
