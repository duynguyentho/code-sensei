import { api } from './gitlab-api';
import { parseDiff } from './parse-diff';
import { MRFileVersions } from '../interfaces/merge-request-file-version';
import { FileDiffResult } from '../interfaces';

export async function getChangedFiles(
  projectId: number,
  mergeRequestId: number,
): Promise<FileDiffResult[]> {
  // Fetch the changes
  const changes = await api.MergeRequests.changes(projectId, mergeRequestId);
  const filesSupported = ['.ts', '.js', '.php'];
  console.log(changes.changes);

  const filteredFiles = changes
    .changes!.filter((diff) =>
      // check file extension
      filesSupported.some((ext) => diff.new_path.endsWith(ext)),
    )
    .map((diff) => ({
      oldPath: diff.old_path,
      newPath: diff.new_path,
      changedRanges: parseDiff(diff.diff),
    }));

  filteredFiles.forEach((path) => console.log(`File changed: ${path.newPath}`));

  // Return the filtered files
  return filteredFiles;
}

export async function getOldAndNewFileVersions(
  projectId: number,
  mergeRequestId: number,
  fileDiff: FileDiffResult,
): Promise<MRFileVersions> {
  // Fetch the merge request
  const mergeRequest = await api.MergeRequests.show(projectId, mergeRequestId);

  // Get the source and target branches of the merge request
  const sourceBranch = mergeRequest.source_branch;
  const targetBranch = mergeRequest.target_branch;

  // Fetch the file from the source branch (new version)
  const newFile = await api.RepositoryFiles.showRaw(
    projectId,
    fileDiff.newPath,
    { ref: sourceBranch },
  );

  // Fetch the file from the target branch (old version)
  let oldFile;

  try {
    oldFile = await api.RepositoryFiles.showRaw(projectId, fileDiff.oldPath, {
      ref: targetBranch,
    });
  } catch (error) {
    // File might not exist in the target branch (e.g., if it was added in this merge request)
    if ((error as any).description === '404 File Not Found') {
      oldFile = null;
    } else {
      throw error;
    }
  }
  return { oldFile, newFile, changedRanges: fileDiff.changedRanges };
}
