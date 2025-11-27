import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { QrService } from './qr.service';
import { CreateQrDto, UpdateQrDto } from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { User } from '@supabase/supabase-js';

@ApiTags('qr')
@Controller('qr')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QrController {
  constructor(private qrService: QrService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new QR code' })
  create(@CurrentUser() user: User, @Body() dto: CreateQrDto) {
    return this.qrService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all QR codes for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@CurrentUser() user: User, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.qrService.findAll(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific QR code by ID' })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.qrService.findOne(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a QR code' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQrDto
  ) {
    return this.qrService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a QR code' })
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.qrService.remove(user.id, id);
  }

  @Get(':id/image')
  @ApiOperation({ summary: 'Generate QR code image' })
  @ApiQuery({ name: 'format', required: false, enum: ['png', 'svg'] })
  async getImage(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('format') format: 'png' | 'svg' = 'png'
  ) {
    return this.qrService.generateImage(user.id, id, format);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download QR code image' })
  @ApiQuery({ name: 'format', required: false, enum: ['png', 'svg'] })
  async download(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('format') format: 'png' | 'svg' = 'png',
    @Res() res: Response
  ) {
    const { filename, content, contentType } = await this.qrService.download(user.id, id, format);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (format === 'svg') {
      res.send(content);
    } else {
      // Convert data URL to buffer
      const base64Data = content.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      res.send(buffer);
    }
  }
}
