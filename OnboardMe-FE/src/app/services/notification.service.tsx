import { Notification } from "../models/Notification";
import api from "./Api";

export const getNotificationsByUser = async (
  idUser: number,
): Promise<Notification[]> => {
  const response = await api.get<Notification[]>(`/notifications/${idUser}`);
  return response.data;
};

export const markNotificationAsRead = async (
  idNotification: number,
): Promise<Notification> => {
  const response = await api.post<Notification>(
    `/notifications/${idNotification}/markAsRead`,
  );
  return response.data;
};

export const createNotification = async (notification: Notification): Promise<Notification> => {
  const response = await api.post<Notification>(`/notifications/create`, notification);
  return response.data;
};
