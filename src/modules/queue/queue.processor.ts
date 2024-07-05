import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { REVIEW_MERGE_REQUEST } from '../../constants';

@Processor('queue')
export class QueueProcessor extends WorkerHost {
  constructor() {}
  private logger = new Logger();

  async process(job: Job<any, any, string>, token?: string): Promise<any> {
    switch (job.name) {
      case REVIEW_MERGE_REQUEST:
        // const { payload, execFunction } = job.data;
        // return await this.newService[execFunction](payload);

      default:
        throw new Error('No job name match');
    }
  }

  @OnWorkerEvent('active')
  onQueueActive(job: Job) {
    this.logger.log(`ACTIVE: ${job.id}`);
  }

  @OnWorkerEvent('completed')
  onQueueComplete(job: Job, result: any) {
    this.logger.log(`COMPLETE: ${job.id}`);
  }

  @OnWorkerEvent('failed')
  onQueueFailed(job: Job, err: any) {
    this.logger.log(`FAILED: ${job.id}`);
    this.logger.log({ err });
  }

  @OnWorkerEvent('error')
  onQueueError(err: any) {
    this.logger.log(`ERROR: `);
    this.logger.log({ err });
  }
}
