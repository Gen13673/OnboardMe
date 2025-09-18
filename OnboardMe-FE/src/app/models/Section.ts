import { SectionContent } from './SectionContent';

export interface Section {
  id: number;
  title: string;
  order?: string;
  idCourse?: number;
  content: SectionContent;
}