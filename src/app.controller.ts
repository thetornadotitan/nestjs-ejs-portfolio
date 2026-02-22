import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  // Will check:
  // - If the application is running and responsive
  // - If the services it depends on are healthy (e.g., database, external APIs)
  // - The uptime of the application
  @Get('/info')
  getInfo(): any {
    // check the health of dependencies here (e.g., database connection, external API status)
    return this.appService.getInfo();
  }
}
