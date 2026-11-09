import { Controller, Get } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('store')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Public()
  @Get()
  async getStoreInfo() {
    return this.settingsService.getStoreSettings();
  }

  @Public()
  @Get('theme')
  async getTheme() {
    const settings = await this.settingsService.getStoreSettings();
    return { theme: settings.activeTheme };
  }
}
