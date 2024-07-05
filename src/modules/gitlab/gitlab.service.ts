import { Injectable } from '@nestjs/common';
import { api } from './utils/gitlab-api';
import { reviewMergeRequest } from './utils/merge-request';
import { SeverityLevel } from './enums';
import { QueueService } from '../queue/queue.service';
import { REVIEW_MERGE_REQUEST } from '../../constants';

@Injectable()
export class GitlabService {
  constructor(
    private readonly queueService: QueueService,
  ) {}

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
      await this.queueService.add(REVIEW_MERGE_REQUEST, {
        projectId,
        mergeRequestId,
        severity,
      })
    }
  }

  /**
   * Asynchronously pushes a merge request into the review queue.
   *
   * This function attempts to review a merge request based on the provided project ID,
   * merge request ID, and severity level. If the review process encounters an error,
   * the error is caught and logged to the console.
   *
   * @param projectId The ID of the project to which the merge request belongs.
   * @param mergeRequestId The ID of the merge request to be reviewed.
   * @param severity The severity level of the review (e.g., 'low', 'medium', 'high').
   */
  async pushMergeRequestIntoQueue(projectId, mergeRequestId, severity) {
    await reviewMergeRequest(projectId, mergeRequestId, severity).catch(error => {
      console.error(
        `Error reviewing merge request ${mergeRequestId} of project ${projectId}:`,
        error,
      );
    });
  }
}
