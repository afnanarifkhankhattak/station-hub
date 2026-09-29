import React, { createContext, useState, useEffect } from 'react';
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

        const parsedUser = JSON.parse(storedUser);

        const secureUser = {
          ...parsedUser,
          role: decodedToken.role // Overwrite any manual changes made by the user
        };

        setUser(secureUser);
        setToken(storedToken);
      } catch (error) {
        // If the token is corrupt or invalid, log them out
        console.error("Invalid token found");
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setToken(null);
      }
    }
    setLoading(false);
  }, []);



  // Handle successful login or registration
  const login = (authResponse) => {
    const { token, refresh_token, user } = authResponse;

    // Save to local state
    setUser(user);
    setToken(token);

    // Persist session tokens across browser tabs/refreshes
    localStorage.setItem('token', token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('theme', 'dark'); // or 'dark'
  };

  // Log user out and purge all local records
  const logout = () => {
    setUser(null);
    setToken(null);
    setPageLoad(true);
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
