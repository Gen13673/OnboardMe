import { User } from "../models/User";
import api from "./Api";

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>("/users");
  return response.data;
};

export const getUserById = async (id: number): Promise<User> => {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
};

export const createUser = async (User: Partial<User>): Promise<User> => {
  const response = await api.post<User>("/users", User);
  return response.data;
};

export const assignBuddy = async (userId: number, buddyId: number): Promise<User> => {
  const response = await api.post<User>(`/users/buddy/${userId}/${buddyId}`);
  return response.data;
};

export const getUsersByBuddy = async (idBuddy: number): Promise<User[]> => {
  const response = await api.get<User[]>(`/users/buddy/${idBuddy}`);
  return response.data;
};

export const uploadUsersCsv = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/users/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data;
};

export const getHello = async () => {
  return await api.get("onboardMe/hello");
};