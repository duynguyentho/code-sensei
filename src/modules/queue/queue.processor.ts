import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { REVIEW_MERGE_REQUEST } from '../../constants';
import { GitlabService } from '../gitlab/gitlab.service';

@Processor('queue')
export class QueueProcessor extends WorkerHost {
  constructor(private readonly gitlabService: GitlabService) {
    super();
  }
  private logger = new Logger();

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case REVIEW_MERGE_REQUEST:
        const { projectId, mergeRequestId, severity } = job.data;
        console.log(projectId, mergeRequestId, severity);
        return await this.gitlabService.pushMergeRequestIntoQueue(
          projectId,
          mergeRequestId,
          severity,
        );
      default:
        throw new Error('No job name match');
    }
  }

  @OnWorkerEvent('active')
  onQueueActive(job: Job) {
    this.logger.log(`ACTIVE: ${job.id}`);
  }

  @OnWorkerEvent('completed')
  onQueueComplete(job: Job) {
    this.logger.log(`COMPLETE: ${job.id}`);

    job
      .remove({
        removeChildren: true,
      })
      .then((res) => this.logger.log(res));
    // clear job queue redis
  }

  @OnWorkerEvent('failed')
  onQueueFailed(job: Job, err: any) {
    this.logger.log(`FAILED: ${job.id}`);
    this.logger.log({ err });

    job.remove().then((res) => this.logger.log(res));
  }

  @OnWorkerEvent('error')
  onQueueError(job: Job, err: any) {
    this.logger.log(`ERROR: `);
    this.logger.log({ err });

    job.remove().then((res) => this.logger.log(res));
  }
}
