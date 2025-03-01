/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { api } from '../../shared/gitlab-api';
import { ReviewComment, Severity, SeverityLevel } from './enums';
import { QueueService } from '../queue/queue.service';
import { REVIEW_MERGE_REQUEST } from '../../constants';
import {
  getChangedFiles,
  getOldAndNewFileVersions,
} from './utils/file-versions';
import { GptService } from '../gpt/gpt.service';
import { initPromt } from '../gpt/utils';
import { FinalReviewComment } from './interfaces/merge-request';
import { FileDiffResult } from './interfaces';
import { parse } from 'ts-jest';
import { LineRange } from './utils/parse-diff';
import { Linter } from 'eslint';
import { sum } from 'lodash';

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

    if (asksForReview && severity) {
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
  async pushMergeRequestIntoQueue(
    projectId: number,
    mergeRequestId: number,
    severity: SeverityLevel,
  ) {
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
    const changedFiles: FileDiffResult[] = await getChangedFiles(
      projectId,
      mergeRequestId,
    );
    for (const paths of changedFiles) {
      const { oldFile, newFile, changedRanges } =
        await getOldAndNewFileVersions(projectId, mergeRequestId, paths);
      const response: string[] = await this.gptService.askGpt({
        message: initPromt(paths, { oldFile, newFile, changedRanges }),
      });

      const parsedComments = response.flatMap((data) => {
        try {
          return [parseComments(data)];
        } catch (error) {
          return [];
        }
      });
      // processComment(parsedComments, newFile);
      console.log(parsedComments[0]);
      // console.log(parseComments(response[0]));
      // parseResponse(response, newFile);
      // TODO: comment to merge request with the response
      // await placeComments(projectId, mergeRequestId, comments, paths);
    }
  }
}

const parseComments = (input: string): ReviewComment[] => {
  // Find the first [ and the last ]
  const start = input.indexOf('[');
  const end = input.lastIndexOf(']');

  // Check if both [ and ] were found
  if (start === -1 || end === -1) {
    throw new Error('Invalid input');
  }

  // Extract the JSON string
  const jsonString = input.slice(start, end + 1);

  try {
    // Parse the JSON string into an array of ReviewComment objects
    const parsed: ReviewComment[] = JSON.parse(jsonString);
    return parsed;
  } catch (err) {
    console.error('Failed to parse JSON: ', err);
    throw new Error('Invalid input');
  }
};

/**
 * Places comments on a specific merge request in GitLab.
 *
 * This function fetches the merge request details and the SHA values for the target and source branches.
 * It then iterates over the provided comments and uses the GitLab API to create discussions on the merge request.
 *
 * @param {number} projectId - The ID of the project to which the merge request belongs.
 * @param {number} mergeRequestId - The ID of the merge request to place comments on.
 * @param {FinalReviewComment[]} comments - An array of comments to be placed on the merge request.
 * @param {FileDiffResult} file - The file diff result containing the paths of the old and new files.
 * @returns {Promise<void>} - A promise that resolves when all comments have been placed.
 */
async function placeComments(
  projectId: number,
  mergeRequestId: number,
  comments: FinalReviewComment[],
  file: FileDiffResult,
): Promise<void> {
  // Fetch the specific merge request using the GitLab API
  const mergeRequest = await api.MergeRequests.show(projectId, mergeRequestId);

  // Get the target branch (typically 'master' or 'main') SHA
  const targetBranch = await api.Branches.show(
    projectId,
    mergeRequest.target_branch,
  );
  const base_sha = targetBranch.commit.id;

  // Get source branch SHA
  const sourceBranch = await api.Branches.show(
    projectId,
    mergeRequest.source_branch,
  );
  const head_sha = sourceBranch.commit.id;

  // In this case, as you want start_sha to be equal to base_sha
  const start_sha = base_sha;

  // Iterate over each comment to be placed
  for (const comment of comments) {
    // Use the GitLab API to create the comment on the merge request
    await api.MergeRequestDiscussions.create(
      projectId,
      mergeRequestId,
      comment.comment,
      {
        position: {
          base_sha: base_sha,
          head_sha: head_sha,
          start_sha: start_sha,
          new_path: file.newPath,
          old_path: file.oldPath,
          position_type: 'text',
          new_line: comment.line,
        },
      },
    );
  }
}

function checkIntersection(
  startLine: number,
  endLine: number,
  ranges: LineRange[],
): boolean {
  for (const range of ranges) {
    const [rangeStart, rangeEnd] = range;
    if (Math.max(startLine, rangeStart) <= Math.min(endLine, rangeEnd)) {
      return true;
    }
  }
  return false;
}
const numberToSeverity: Record<number, 'low' | 'medium' | 'high'> = {
  1: 'low',
  2: 'low',
  3: 'medium',
  4: 'high',
  5: 'high',
};
