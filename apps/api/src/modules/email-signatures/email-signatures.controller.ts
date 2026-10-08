import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards';
import { CreateEmailSignatureRequestDto, UpdateEmailSignatureRequestDto } from './dto';
import { EmailSignaturesService } from './email-signatures.service';

@ApiTags('email-signatures')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('email-signatures')
export class EmailSignaturesController {
  constructor(private readonly service: EmailSignaturesService) {}

  @Get()
  @ApiOperation({ summary: "List the authenticated user's Email Signatures" })
  list(@CurrentUser() user: User) { return this.service.list(user.id); }

  @Get(':id')
  @ApiOperation({ summary: 'Get one owned Email Signature' })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an Email Signature snapshot' })
  create(@CurrentUser() user: User, @Body() dto: CreateEmailSignatureRequestDto) {
    return this.service.create(user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an owned Email Signature snapshot' })
  update(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEmailSignatureRequestDto) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an owned Email Signature snapshot' })
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user.id, id);
  }
}
