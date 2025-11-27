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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LinksService } from './links.service';
import { CreateLinkDto, UpdateLinkDto } from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { User } from '@supabase/supabase-js';

@ApiTags('links')
@Controller('links')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LinksController {
  constructor(private linksService: LinksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shortened link' })
  create(@CurrentUser() user: User, @Body() dto: CreateLinkDto) {
    return this.linksService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all links for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@CurrentUser() user: User, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.linksService.findAll(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific link by ID' })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.linksService.findOne(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a link' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLinkDto
  ) {
    return this.linksService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a link' })
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.linksService.remove(user.id, id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get link statistics and analytics' })
  getStats(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.linksService.getStats(user.id, id);
  }
}
