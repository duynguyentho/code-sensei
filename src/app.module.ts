import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GitlabModule } from './modules/gitlab/gitlab.module';
import { BullModule } from '@nestjs/bullmq';
import { QueueModule } from './modules/queue/queue.module';
import { GptService } from './modules/gpt/gpt.service';
import { GptModule } from './modules/gpt/gpt.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GitlabModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          connection: {
            host: configService.get('REDIS_HOST'),
            port: configService.get('REDIS_PORT'),
          },
        };
      },
    }),
    QueueModule,
    GptModule,
  ],
  controllers: [AppController],
  providers: [AppService, GptService],
})
export class AppModule {}
