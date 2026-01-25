
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User, UserPreferences } from "@/types/project";
import { api } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "electrolab_user";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem("access_token");
    if (token) {
      // Ideally verify token with backend here, or decode basic info
      // For simplicity, we assume if token exists, we are logged in.
      // In a real app, you'd fetch /users/me
      const email = localStorage.getItem("user_email") || "";
      setUser({
        id: "current", // MongoDB ID would come from /me endpoint
        email: email,
        name: email.split("@")[0],
        createdAt: new Date(),
        preferences: { theme: 'dark' }
      });
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/token', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { access_token } = response.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("user_email", email);

      setUser({
        id: "current",
        email: email,
        name: email.split("@")[0],
        createdAt: new Date(),
        preferences: { theme: 'dark' }
      });
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      await api.post('/auth/signup', {
        email,
        password,
        name
      });
      // Auto login after signup
      return await login(email, password);
    } catch (error) {
      console.error("Signup failed:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
    setUser(null);
  };

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    if (user) {
      setUser({
        ...user,
        preferences: { ...user.preferences, ...prefs }
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      signup,
      logout,
      updateProfile,
      updatePreferences
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
