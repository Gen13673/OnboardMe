export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE";

export interface SurveyOption {
  id: number;
  text: string;
}

export interface SurveyQuestion {
  id: number;
  text: string;
  type: QuestionType;
  options: SurveyOption[];
}

export interface SurveyAnswer {
  questionId: number;
  selectedOptionIds: number[];
}

export interface SurveyQuestionResult {
  questionId: number;
  selectedOptionIds: number[];
}

export interface SurveyResult {
  totalQuestions: number;
  results: SurveyQuestionResult[];
}

export interface SurveySubmission {
  answers: SurveyAnswer[];
}
