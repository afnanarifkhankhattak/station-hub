import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../src/config"; // adjust relative path as needed
import { apiFetch } from "../src/api";


type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  profile_image?: string;
  agreed_to_privacy_policy?: boolean;
  // ...other fields
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

  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // show cached user instantly
      const cached = await AsyncStorage.getItem("cached_user");
      if (cached) {
        setUser(JSON.parse(cached));
        setLoading(false); // stop spinner, show cached user immediately
      }

      // fetch fresh in background
      const res = await apiFetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        AsyncStorage.setItem("cached_user", JSON.stringify(data.user));
      } else {
        if (!cached) setUser(null);
      }
    } catch (e) {
      if (!(await AsyncStorage.getItem("cached_user"))) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem("cached_user", JSON.stringify(updated)); // ← keep cache in sync
      return updated;
    });
  };

  return (
    <UserContext.Provider
      value={{ user, loading, refreshUser: fetchUser, updateUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
