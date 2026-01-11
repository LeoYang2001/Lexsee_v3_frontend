
export interface AllTimeSchedule {
  id: string;
  scheduleDate: string;
  totalWords: number;
  toBeReviewedCount: number;
  reviewedCount: number;
  successRate: number;
  scheduleWords?: string[];
}
