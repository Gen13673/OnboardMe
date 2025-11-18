import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { getUserById } from "@/app/services/usuario.service";
import { LoginResponse } from "@/app/models/LoginResponse";
import { User } from "@/app/models/User";
import Cookies from "js-cookie";
import { logoutUser as logoutService } from "@/app/services/login.service";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

type AuthContextType = {
  user: User | null;
  login: (authData: LoginResponse) => Promise<void>;
  logout: (router: AppRouterInstance) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedAuthData = Cookies.get("authData");
        if (storedAuthData) {
            try {
                const authData: LoginResponse = JSON.parse(storedAuthData);
                setUser({
                    id: authData.userId,
                    firstName: (authData as any).nombre,
                    lastName: (authData as any).apellido,
                    email: (authData as any).email,
                    area: (authData as any).area,
                    role: { name: (authData as any).role } as any,
                } as User);
            } catch (error) {
                console.error("Error al cargar el usuario desde las cookies", error);
                Cookies.remove("authData");
            }
        }
        setLoading(false);
    }, []);

    const login = async (authData: LoginResponse) => {
        try {
            Cookies.set("authData", JSON.stringify(authData), { expires: 7 });
            setUser({
                id: authData.userId,
                firstName: (authData as any).nombre,
                lastName: (authData as any).apellido,
                email: (authData as any).email,
                area: (authData as any).area,
                role: { name: (authData as any).role } as any,
            } as User);
        } catch (error) {
            console.error("Error al setear el usuario después del login", error);
            Cookies.remove("authData");// Si falla, limpiamos para no dejar un estado inconsistente
            setUser(null);
            throw error; // Propagamos el error para que el componente de login lo maneje
        }
    };

  const logout = useCallback(
    async (router: AppRouterInstance) => {
      try {
        await logoutService();
      } catch (error) {
        console.error("Error al cerrar sesión en el backend:", error);
      } finally {
        Cookies.remove("authData");
        localStorage.clear(); // Limpia todo el localStorage
        setUser(null);
        router.push("/");
      }
    }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};
