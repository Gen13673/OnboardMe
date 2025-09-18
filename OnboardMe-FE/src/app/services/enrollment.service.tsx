import api from "./Api";
import { Enrollment } from "../models/Enrollment";

export const getEnrollment = async (
  courseId: number,
  userId: number
): Promise<Enrollment> => {
  const response = await api.get<Enrollment>(`/courses/enrollment/${courseId}/${userId}`);
  return response.data;
};
