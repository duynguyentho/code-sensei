import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GitlabModule } from './modules/gitlab/gitlab.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GitlabModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
