import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DigitalCardsService } from './digital-cards.service';

@ApiTags('public-digital-cards')
@UseGuards(ThrottlerGuard)
@Controller('public/digital-cards')
export class PublicDigitalCardsController {
  constructor(private readonly digitalCardsService: DigitalCardsService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Resolve the public projection of a published Digital Card' })
  findPublished(@Param('slug') slug: string) {
    if (!/^[a-f0-9]{32}$/.test(slug)) throw new NotFoundException('Digital Card not found');
    return this.digitalCardsService.findPublished(slug);
  }
}
