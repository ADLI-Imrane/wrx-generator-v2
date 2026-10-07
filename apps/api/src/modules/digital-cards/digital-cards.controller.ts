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
import { CreateDigitalCardRequestDto, UpdateDigitalCardRequestDto } from './dto';
import { DigitalCardsService } from './digital-cards.service';

@ApiTags('digital-cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('digital-cards')
export class DigitalCardsController {
  constructor(private readonly digitalCardsService: DigitalCardsService) {}

  @Get()
  @ApiOperation({ summary: "List the authenticated user's Digital Cards" })
  list(@CurrentUser() user: User) {
    return this.digitalCardsService.list(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one owned Digital Card' })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.digitalCardsService.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an unpublished Digital Card snapshot' })
  create(@CurrentUser() user: User, @Body() dto: CreateDigitalCardRequestDto) {
    return this.digitalCardsService.create(user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an owned Digital Card snapshot' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDigitalCardRequestDto
  ) {
    return this.digitalCardsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an owned Digital Card' })
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.digitalCardsService.remove(user.id, id);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish an owned Digital Card after validation' })
  publish(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.digitalCardsService.publish(user.id, id);
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish an owned Digital Card' })
  unpublish(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.digitalCardsService.unpublish(user.id, id);
  }
}
