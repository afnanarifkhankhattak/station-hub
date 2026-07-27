import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../src/config";
import { apiFetch } from "../src/api";

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  profile_image?: string;
  agreed_to_privacy_policy?: boolean;
};

type UserContextType = {
  user: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const cached = await AsyncStorage.getItem("cached_user");
      if (cached) {
        setUser(JSON.parse(cached));
        setLoading(false);
      }

      const res = await apiFetch(`${API_BASE}/auth/me`);
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        AsyncStorage.setItem("cached_user", JSON.stringify(data.user));
      } else if (!cached) {
        setUser(null);
      }
    } catch {
      if (!(await AsyncStorage.getItem("cached_user"))) setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const updateUser = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem("cached_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = useMemo(
    () => ({ user, loading, refreshUser: fetchUser, updateUser }),
    [user, loading, fetchUser, updateUser],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
