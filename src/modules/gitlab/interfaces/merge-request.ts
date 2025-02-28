export interface ReviewCommentOnLine {
  line: number;
  comment: string;
  severity: 'low' | 'medium' | 'high';
}

export interface FinalReviewComment {
  line: number;
  comment: string;
  severity: 'low' | 'medium' | 'high';
}
