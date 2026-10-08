import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';

export const DIGITAL_CARD_SLUG_COLLISION_ATTEMPTS = 5;

@Injectable()
export class DigitalCardSlugGenerator {
  /** 128 bits of cryptographic entropy, represented as a URL-safe lowercase hex slug. */
  generate(): string {
    return randomBytes(16).toString('hex');
  }
}
