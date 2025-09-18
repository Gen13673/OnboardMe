import { Role } from "./Role";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  area: string;
  createdDate: Date;
  status: string;
  role: Role;
  buddy: User;
  address: string;
  phone: string;
  birthDate: Date;
}