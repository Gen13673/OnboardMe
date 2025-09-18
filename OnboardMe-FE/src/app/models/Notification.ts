import { User } from "./User";

export interface Notification {
    id: number;
    idUser: number;
    title: string;
    message: string;
    sentDate: Date;
    seen: boolean;
}