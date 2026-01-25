import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User, UserPreferences } from "@/types/project";

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
    // Check localStorage for existing session
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Convert date strings back to Date objects
        parsed.createdAt = new Date(parsed.createdAt);
        setUser(parsed);
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login - ready for backend integration
    // TODO: Replace with actual API call
    const mockUser: User = {
      id: crypto.randomUUID(),
      email,
      name: email.split("@")[0],
      createdAt: new Date(),
      preferences: {
        theme: 'dark',
      }
    };
    setUser(mockUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
    return true;
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    // Mock signup - ready for backend integration
    // TODO: Replace with actual API call
    const mockUser: User = {
      id: crypto.randomUUID(),
      email,
      name,
      createdAt: new Date(),
      preferences: {
        theme: 'dark',
      }
    };
    setUser(mockUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    }
  };

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    if (user) {
      const updatedUser = {
        ...user,
        preferences: { ...user.preferences, ...prefs }
      };
      setUser(updatedUser as User);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
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
