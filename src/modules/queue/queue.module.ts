import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { BullModule } from '@nestjs/bullmq';
import * as process from 'process';
import { GitlabModule } from '../gitlab/gitlab.module';

@Module({
  imports: [
    BullModule.registerQueue({
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
      name: 'queue',
      prefix: 'queue',
    }),
    GitlabModule,
  ],
  providers: [QueueService]
})
export class QueueModule {

}
