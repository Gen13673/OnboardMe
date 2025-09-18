import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getUserById } from '@/app/services/usuario.service';
import { User } from '@/app/models/User';

type AuthContextType = {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    const login = (user: User) => setUser(user);
    const logout = () => setUser(null);

    useEffect(() => {
        const fetchUser = async () => {
            const user = await getUserById(13);
            setUser(user);
        };

        fetchUser()
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
    return context;
};
