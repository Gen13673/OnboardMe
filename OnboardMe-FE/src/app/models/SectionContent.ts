import type { ExamQuestion } from "./exam";

export type SectionContentType =
  | "VIDEO"
  | "DOCUMENT"
  | "IMAGE"
  | "EXAM"
  | "SURVEY";

export interface SectionContent {
  id: number;
  contentId: number;
  sectionId: number;
  type: SectionContentType;
  url?: string;
  file?: File | null;
  timeLimit?: number;
  questions?: ExamQuestion[];
}
