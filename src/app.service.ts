import { Injectable } from '@nestjs/common';
import { uptime } from 'process';
import { prettyTime } from './utils/time';

@Injectable()
export class AppService {
  getInfo(): any {
    // Check the health of dependencies here (e.g., database connection, external API status)
    // Call the getInfo method of each dependency and include their status in the response
    // Return a comprehensive status object that includes the health of the application and its dependencies
    return {
      status: 'up',
      health: 'healthy',
      uptime: prettyTime(uptime()), // Uptime in seconds
      dependancies: {
        // exmaple: {
        //   status: 'up',
        //   health: 'healthy',
        //   uptime: 'N/A',
        // },
      },
    };
  }
}
