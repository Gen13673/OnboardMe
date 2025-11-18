export interface LoginResponse {
  token: string;
  userId: number;
  nombre: string;
  apellido: string;
  email: string;
  area: string;
  role: string;
}