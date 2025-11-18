import { ChangePassword200Response } from "../models/ChangePassword200Response";
import { ChangePasswordRequest } from "../models/ChangePasswordRequest";
import { ResetPassword200Response } from "../models/ResetPassword200Response";
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
  const response = await api.post<User>("/users/addUser", User);
  return response.data;
};

export const changePassword = async (userId: number, passwords: ChangePasswordRequest): Promise<ChangePassword200Response> => {
  const response = await api.post<ChangePassword200Response>(`/users/${userId}/changepassword`, passwords);
  return response.data;
};

export const resetPassword = async (email: string, passwords: ChangePasswordRequest): Promise<ResetPassword200Response> => {
  const response = await api.post<ResetPassword200Response>(`/users/${email}/resetpassword`, passwords);
  return response.data;
};

export const assignBuddy = async (
  userId: number,
  buddyId: number,
): Promise<User> => {
  const response = await api.post<User>(`/users/buddy/${userId}/${buddyId}`);
  return response.data;
};

export const getUsersByBuddy = async (idBuddy: number): Promise<User[]> => {
  const response = await api.get<User[]>(`/users/buddy/${idBuddy}`);
  return response.data;
};

export const uploadUsersCsv = async (file: File, userId: number): Promise<any> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(`/users/upload/${userId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export type EmployeeOverview = {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    roleName: string | null;
    buddyFullName: string | null;
    coursesCount: number;
    avgProgress: number;
};

export type Page<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
};

export const getEmployeesOverview = async (
    search = "",
    page = 0,
    size = 50
): Promise<Page<EmployeeOverview>> => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("size", String(size));
    const resp = await api.get<Page<EmployeeOverview>>(`/users/overview?${params.toString()}`);
    return resp.data;
};

export type AssignBuddyBulkResponse = {
    assigned: number[];
    skippedAlreadyAssigned: number[];
    skippedSelfAssignment: number[];
    notFound: number[];
};

export async function assignBuddyBulk(userIds: number[], buddyId: number) {
    const { data } = await api.post<AssignBuddyBulkResponse>(
        "/users/buddy/bulk",
        { buddyId, userIds }
    );
    return data;
}

export async function getUserOverview(idUser: number): Promise<EmployeeOverview> {
    const resp = await api.get<EmployeeOverview>(`/users/${idUser}/overview`);
    return resp.data;
}


