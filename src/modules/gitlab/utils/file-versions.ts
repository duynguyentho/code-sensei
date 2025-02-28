import { api } from '../../../shared/gitlab-api';
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

export function getLineNumbers(
  source: string,
  quote: string,
): [number, number] | null {
  const location = locateInSource(source, quote);
  if (location === null) {
    return null;
  }

  // count the number of newline characters up to the start index
  const [start, end] = location;
  const beforeQuote = source.slice(0, start);
  const afterQuote = source.slice(0, end);
  const lineNumberStart = (beforeQuote.match(/\n/g) || []).length + 1;
  const lineNumberEnd = (afterQuote.match(/\n/g) || []).length + 1;

  return [lineNumberStart, lineNumberEnd];
}

export function getLineNumber(source: string, quote: string): number | null {
  const lineNumbers = getLineNumbers(source, quote);
  if (lineNumbers === null) {
    return null;
  } else {
    return lineNumbers[0];
  }
}

export function locateInSource(
  source: string,
  quote: string,
): [number, number] | null {
  // remove all whitespace from both source and quote
  const normalizedSource = normalizeWhitespace(source);
  const normalizedQuote = normalizeWhitespace(quote);

  const normalizedStart = normalizedSource.indexOf(normalizedQuote);
  if (normalizedStart === -1) {
    return null;
  }

  const normalizedEnd = normalizedStart + normalizedQuote.length;

  return reconstructOriginalLocation(source, normalizedStart, normalizedEnd);
}

function normalizeWhitespace(str: string): string {
  // remove all whitespace characters, including newlines
  return str.replace(/\s+/g, '');
}

function reconstructOriginalLocation(
  source: string,
  normalizedStart: number,
  normalizedEnd: number,
): [number, number] {
  let originalStart = 0;
  let originalEnd = 0;
  let nonWhitespaceCharsCount = 0;

  for (let i = 0; i < source.length; i++) {
    if (/\s/.test(source[i])) {
      continue; // skip whitespace
    }

    if (nonWhitespaceCharsCount === normalizedStart) {
      originalStart = i;
    }

    if (nonWhitespaceCharsCount === normalizedEnd - 1) {
      originalEnd = i + 1;
      break;
    }

    nonWhitespaceCharsCount++;
  }

  return [originalStart, originalEnd];
}
