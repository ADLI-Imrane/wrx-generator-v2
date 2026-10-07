import { Module } from '@nestjs/common';
import { DigitalCardSlugGenerator } from './digital-card-slug';
import { DigitalCardsController } from './digital-cards.controller';
import { DigitalCardsService } from './digital-cards.service';
import { PublicDigitalCardsController } from './public-digital-cards.controller';

@Module({
  controllers: [DigitalCardsController, PublicDigitalCardsController],
  providers: [DigitalCardsService, DigitalCardSlugGenerator],
})
export class DigitalCardsModule {}
