import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { GitCalendarModule } from './modules/git-calendar/git-calendar.module';
import { CatalogModule } from './modules/catalog/catalog.module';

@Module({
  imports: [PortfolioModule, GitCalendarModule, CatalogModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
