import api from "./Api";
import { LoginResponse } from "../models/LoginResponse";
import { LoginRequest } from "../models/LoginRequest";

export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", credentials);
  return response.data;
};

export const logoutUser = async () => {
  await api.post("/auth/logout");
};