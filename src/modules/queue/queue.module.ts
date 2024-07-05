import { forwardRef, Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { BullModule } from '@nestjs/bullmq';
import * as process from 'process';
import { GitlabModule } from '../gitlab/gitlab.module';
import { QueueProcessor } from './queue.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'queue',
      prefix: 'queue',
    }),
    forwardRef(() => GitlabModule)
  ],
  providers: [QueueService, QueueProcessor],
  exports: [QueueService]
})
export class QueueModule {

}
