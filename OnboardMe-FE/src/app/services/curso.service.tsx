import api from "./Api";
import { Course } from "../models/Course";

// Obtener todos los cursos
export const getCourses = async (): Promise<Course[]> => {
  const response = await api.get<Course[]>("/courses");
  return response.data;
};

// Obtener un curso por ID
export const getCourseById = async (id: number): Promise<Course> => {
  const response = await api.get<Course>(`/courses/get/${id}`);
  return response.data;
};

// Obtener los cursos de un usuario
export const getCoursesByUser = async (idLegajo: number): Promise<Course[]> => {
  const response = await api.get<Course[]>(`/courses/${idLegajo}`);
  return response.data;
};

// Marcar curso como favorito
export const favCourse = async (idCourse: number, idUser: number): Promise<void> => {
  const response = await api.post(`/courses/favorite/${idCourse}/${idUser}`);
  return response.data;
};

// Crear un curso nuevo
export const createCourse = async (course: Omit<Course, "id" | "createdDate">): Promise<Course> => {
  const response = await api.post<Course>("/courses/create", course);
  return response.data;
};

// Actualizar un curso existente
export const updateCourse = async (
  id: number,
  course: Partial<Omit<Course, "id">>
): Promise<Course> => {
  const response = await api.put<Course>(`/courses/${id}`, course);
  return response.data;
};

// Eliminar un curso
export const deleteCourse = async (id: number): Promise<void> => {
  await api.delete(`/courses/${id}`);
};

// Devuelve el porcentaje total completado del curso
export const getCourseProgress = async (courseId: number, userId: number): Promise<number> => {
  const response = await api.get<number>(`/courses/progress/${courseId}/${userId}`);
  return response.data;
};

// Actualiza el progreso de un curso
export const updateCourseProgress = async (
  courseId: number,
  userId: number,
  sectionId: number
): Promise<void> => {
  const response = await api.post<void>(
    `/courses/progress/${courseId}/${userId}/${sectionId}`
  );
  return response.data;
};

// Asigna un curso a un usuario
export const assignCourse = async (
  courseId: number,
  buddyId: number,
  userId: number
): Promise<void> => {
  await api.post<void>(`/courses/assign/${courseId}/${buddyId}/${userId}`);
};
