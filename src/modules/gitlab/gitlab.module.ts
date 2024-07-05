import { forwardRef, Module } from '@nestjs/common';
import { GitlabService } from './gitlab.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    forwardRef(() => QueueModule)
  ],
  providers: [GitlabService],
  exports: [GitlabService]
})
export class GitlabModule {}
