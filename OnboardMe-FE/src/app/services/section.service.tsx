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
  submission: ExamSubmission
): Promise<ExamResult> {
  const { data } = await api.post<ExamResult>(
    `/sections/${sectionId}/exam/submit/${userId}`,
    submission
  );
  return data;
}

// Obtener resultado del Examen
export async function getExamResult(
  sectionId: number,
  userId: number
): Promise<ExamResult> {
  const { data } = await api.get<ExamResult>(
    `/sections/${sectionId}/exam/result/${userId}`
  );
  return data;
}