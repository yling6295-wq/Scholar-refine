export type SegmentType = 'original' | 'style' | 'source';

export interface RefinementSegment {
  text: string;
  type: SegmentType;
  originalSource?: string; // Only for 'source' type
  explanation?: string;    // For 'style' or 'source'
}

export interface RefinementResult {
  segments: RefinementSegment[];
}

export interface ProcessingState {
  status: 'idle' | 'processing' | 'success' | 'error';
  message?: string;
}
