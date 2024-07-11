import { Injectable } from '@nestjs/common';
import { GitlabService } from './modules/gitlab/gitlab.service';

@Injectable()
export class AppService {
  constructor(private readonly gitlabService: GitlabService) {}
  getHello(): string {
    return 'Hello World!';
  }

  async processWebhook(req: any): Promise<any> {
    const data = req.body;
    console.log(
      'Received webhook:',
      data?.object_kind,
      data?.object_attributes.noteable_type,
    );

    if (
      data.object_kind === 'note' &&
      data.object_attributes.noteable_type === 'MergeRequest'
    ) {
      const commentBody = data.object_attributes.note;

      console.log('====================================');
      console.log(commentBody);
      console.log('====================================');

      return await this.gitlabService.handleMergeRequestComment(
        commentBody,
        data,
      );
    }
  }
}
