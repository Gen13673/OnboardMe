export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'

export interface ExamOption {
  id: number
  text: string
  correct?: boolean
}

export interface ExamQuestion {
  id: number
  text: string
  type: QuestionType
  options: ExamOption[]
}

export interface ExamAnswer {
  questionId: number
  selectedOptionIds: number[]
}

export interface ExamQuestionResult {
  questionId: number
  selectedOptionIds: number[]
  correctOptionIds: number[]
  correct: boolean
}

export interface ExamResult {
  score: number
  totalQuestions: number
  results: ExamQuestionResult[]
}

export interface ExamSubmission {
  answers: ExamAnswer[]
}