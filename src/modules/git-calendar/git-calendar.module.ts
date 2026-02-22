import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { GitCalendarService } from './git-calendar.service';
import { GitCalendarController } from './git-calendar.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({
      isGlobal: true,
      ttl: 30 * 60 * 1000, // 30 minutes
      max: 500,
    }),
  ],
  controllers: [GitCalendarController],
  providers: [GitCalendarService],
  exports: [GitCalendarService],
})
export class GitCalendarModule {}
