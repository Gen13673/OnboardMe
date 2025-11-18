import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import type { LoginResponse } from "../models/LoginResponse";

const api = axios.create({
  baseURL: "http://localhost:8080",
});

// Interceptor para añadir el token JWT a cada petición
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Intentamos obtener los datos de autenticación desde las cookies
    const storedAuthData = Cookies.get("authData");

    if (storedAuthData) {
      try {
        const authData: LoginResponse = JSON.parse(storedAuthData);
        if (authData?.token) {
          // Si tenemos un token, lo añadimos a la cabecera de autorización
          config.headers.Authorization = `Bearer ${authData.token}`;
        }
      } catch (error) {
        console.error("Error al parsear authData desde las cookies", error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
