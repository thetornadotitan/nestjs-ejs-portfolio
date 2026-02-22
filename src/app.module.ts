import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { GitCalendarModule } from './modules/git-calendar/git-calendar.module';

@Module({
  imports: [PortfolioModule, GitCalendarModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
