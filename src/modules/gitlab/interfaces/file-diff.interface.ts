import { LineRange } from '../utils/parse-diff';

export interface FileDiffResult {
  oldPath: string;
  newPath: string;
  changedRanges: LineRange[];
}
