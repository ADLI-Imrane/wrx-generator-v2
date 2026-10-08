import { Module } from '@nestjs/common';
import { EmailSignatureAssetsController } from './email-signature-assets.controller';
import { EmailSignaturesController } from './email-signatures.controller';
import { EmailSignaturesService } from './email-signatures.service';

@Module({
  // Register static /assets routes before /:id to prevent the record route capturing `assets`.
  controllers: [EmailSignatureAssetsController, EmailSignaturesController],
  providers: [EmailSignaturesService],
})
export class EmailSignaturesModule {}
