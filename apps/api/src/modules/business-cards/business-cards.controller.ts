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
import { BusinessCardsService } from './business-cards.service';
import { CreateBusinessCardRequestDto, UpdateBusinessCardRequestDto } from './dto';

@ApiTags('business-cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('business-cards')
export class BusinessCardsController {
  constructor(private readonly businessCardsService: BusinessCardsService) {}

  @Get()
  @ApiOperation({ summary: 'List the current user’s saved business cards' })
  list(@CurrentUser() user: User) {
    return this.businessCardsService.list(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one owned business card' })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.businessCardsService.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Save a business card snapshot' })
  create(@CurrentUser() user: User, @Body() dto: CreateBusinessCardRequestDto) {
    return this.businessCardsService.create(user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an owned business card snapshot' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBusinessCardRequestDto
  ) {
    return this.businessCardsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an owned business card' })
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.businessCardsService.remove(user.id, id);
  }
}
