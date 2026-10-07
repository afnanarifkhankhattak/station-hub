// frontend/src/context/AuthContext.jsx

import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        const decodedToken = jwtDecode(storedToken);

        // Reject expired tokens immediately
        if (decodedToken.exp && Date.now() >= decodedToken.exp * 1000) {
          throw new Error('Token expired');
        }

        const parsedUser = JSON.parse(storedUser);

        // ✅ FIX: Trust the role from the signed JWT — not from localStorage.
        // Also strip whitespace (Firestore sometimes stores trailing \n).
        const secureUser = {
          ...parsedUser,
          role: (decodedToken.role || 'user').trim(),
        };

        setUser(secureUser);
        setToken(storedToken);
      } catch (error) {
        console.error('Invalid or expired token:', error.message);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setToken(null);
      }
    }
    setLoading(false);
  }, []);

  const login = (authResponse) => {
    const { token, refresh_token, user } = authResponse;

    setUser(user);
    setToken(token);

    localStorage.setItem('token', token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('theme', 'dark');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};