import { LineRange } from '../utils/parse-diff';

export interface MRFileVersions {
  oldFile: string | null;
  newFile: string;
  changedRanges: LineRange[];
}
