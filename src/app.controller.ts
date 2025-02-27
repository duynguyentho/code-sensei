import { Controller, Get, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('webhook')
  async webhook(@Req() req: any): Promise<string> {
    await this.appService.processWebhook(req);
    return 'OK';
  }
}
