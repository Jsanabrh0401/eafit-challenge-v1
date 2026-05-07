import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'persona-agent-creator-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
