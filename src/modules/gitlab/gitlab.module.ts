import { forwardRef, Module } from '@nestjs/common';
import { GitlabService } from './gitlab.service';
import { QueueModule } from '../queue/queue.module';
import { GptModule } from '../gpt/gpt.module';

@Module({
  imports: [forwardRef(() => QueueModule), GptModule],
  providers: [GitlabService],
  exports: [GitlabService],
})
export class GitlabModule {}
