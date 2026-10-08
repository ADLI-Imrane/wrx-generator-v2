import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards';
import { EMAIL_SIGNATURE_IMAGE_MAX_BYTES, EmailSignaturesService } from './email-signatures.service';

interface UploadedSignatureImage {
  buffer: Buffer;
  size: number;
  mimetype: string;
}

@ApiTags('email-signature-assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('email-signatures/assets')
export class EmailSignatureAssetsController {
  constructor(private readonly service: EmailSignaturesService) {}

  @Get()
  @ApiOperation({ summary: "List the authenticated user's published Email Signature images" })
  list(@CurrentUser() user: User) { return this.service.listAssets(user.id); }

  @Post()
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: EMAIL_SIGNATURE_IMAGE_MAX_BYTES } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['image', 'kind'], properties: {
    image: { type: 'string', format: 'binary' },
    kind: { type: 'string', enum: ['avatar', 'company-logo'] },
  } } })
  @ApiOperation({ summary: 'Explicitly publish a PNG/JPEG image for durable email signature use' })
  upload(@CurrentUser() user: User, @UploadedFile() file: UploadedSignatureImage, @Body('kind') kind: string) {
    return this.service.uploadAsset(user.id, file, kind);
  }

  @Post('profile/:kind')
  @ApiOperation({ summary: 'Copy a selected private Profile image into durable Email Signature storage' })
  copyProfile(@CurrentUser() user: User, @Param('kind') kind: string) {
    return this.service.copyProfileAsset(user.id, kind);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an owned image when no saved signature uses it' })
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeAsset(user.id, id);
  }
}
