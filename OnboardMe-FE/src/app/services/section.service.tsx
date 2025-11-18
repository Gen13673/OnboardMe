import { SurveyResult, SurveySubmission } from "../models/Survey";
import api from "./Api";
import type { ExamSubmission, ExamResult } from "@/app/models/exam";

export async function getSectionContent(sectionId: number) {
  const response = await api.get(`/sections/${sectionId}/content`);
  return response.data;
}

// Enviar Examen
export async function submitExam(
  sectionId: number,
  userId: number,
  submission: ExamSubmission,
): Promise<ExamResult> {
  const { data } = await api.post<ExamResult>(
    `/sections/${sectionId}/exam/submit/${userId}`,
    submission,
  );
  return data;
}

// Obtener resultado del Examen
export async function getExamResult(
  sectionId: number,
  userId: number,
): Promise<ExamResult> {
  const { data } = await api.get<ExamResult>(
    `/sections/${sectionId}/exam/result/${userId}`,
  );
  return data;
}

// Enviar Encuesta
export async function submitSurvey(
  sectionId: number,
  userId: number,
  submission: SurveySubmission,
): Promise<SurveyResult> {
  const { data } = await api.post<SurveyResult>(
    `/sections/${sectionId}/survey/submit/${userId}`,
    submission,
  );
  return data;
}

// Obtener resultado del Encuesta
export async function getSurveyResult(
  sectionId: number,
  userId: number,
): Promise<SurveyResult> {
  const { data } = await api.get<SurveyResult>(
    `/sections/${sectionId}/survey/result/${userId}`,
  );
  return data;
}
