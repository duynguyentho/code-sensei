/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { api } from '../../shared/gitlab-api';
import { SeverityLevel } from './enums';
import { QueueService } from '../queue/queue.service';
import { REVIEW_MERGE_REQUEST } from '../../constants';
import {
  getChangedFiles,
  getOldAndNewFileVersions,
} from './utils/file-versions';
import { GptService } from '../gpt/gpt.service';
import { initPromt } from '../gpt/utils';

@Injectable()
export class GitlabService {
  constructor(
    private readonly queueService: QueueService,
    private gptService: GptService,
  ) {}

  async handleMergeRequestComment(commentBody: any, data: any) {
    const currentUser = await api.Users.current();
    const mentionsCurrentUser = commentBody.includes(
      '@' + currentUser.username,
    );
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
      });
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
    await this.reviewMergeRequest(projectId, mergeRequestId, severity).catch(
      (error) => {
        console.error(
          `Error reviewing merge request ${mergeRequestId} of project ${projectId}:`,
          error,
        );
      },
    );
  }

  async reviewMergeRequest(
    projectId: number,
    mergeRequestId: number,
    _minSeverity: SeverityLevel = 'low',
  ): Promise<void> {
    const changedFiles = await getChangedFiles(projectId, mergeRequestId);

    for (const paths of changedFiles) {
      const { oldFile, newFile, changedRanges } =
        await getOldAndNewFileVersions(projectId, mergeRequestId, paths);
      const response = await this.gptService.askGpt({
        message: initPromt(paths, { oldFile, newFile, changedRanges }),
      });

      // TODO: comment to merge request with the response
      // await placeComments(projectId, mergeRequestId, comments, paths);
    }
  }
}
