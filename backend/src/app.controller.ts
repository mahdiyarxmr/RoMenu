import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'RoMenu API — بوفه هوشمند رُکاد',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('health')
  getHealthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
