import { Injectable } from '@nestjs/common';
import { api } from './utils/gitlab-api';
import { reviewMergeRequest } from './utils/merge-request';
import { SeverityLevel } from './enums';

@Injectable()
export class GitlabService {
  async handleMergeRequestComment(commentBody: any, data: any) {
    const currentUser = await api.Users.current();
    const mentionsCurrentUser = commentBody.includes('@' + currentUser.username);
    const asksForReview = commentBody.toLowerCase().includes('review');

    let severity: SeverityLevel | null = null;
    const severityLevels: SeverityLevel[] = ['low', 'medium', 'high'];

    for (const severityLevel of severityLevels) {
      if (commentBody.includes(severityLevel)) {
        severity = severityLevel;
      }
    }

    if (mentionsCurrentUser && asksForReview && severity) {
      const projectId = data.project_id;
      const mergeRequestId = data.merge_request.iid;

      // Call the review function asynchronously
      await reviewMergeRequest(projectId, mergeRequestId, severity).catch(error => {
        console.error(
          `Error reviewing merge request ${mergeRequestId} of project ${projectId}:`,
          error,
        );
      });
    }
  }
}
