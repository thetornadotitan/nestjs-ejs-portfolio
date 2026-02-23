import { Module } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { GitCalendarModule } from '../git-calendar/git-calendar.module';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [GitCalendarModule, CatalogModule],
  providers: [PortfolioService],
  controllers: [PortfolioController],
})
export class PortfolioModule {}
