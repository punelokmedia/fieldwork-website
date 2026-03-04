import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Ensure API_URL doesn't have a trailing slash
  const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

  useEffect(() => {
    // Set up axios interceptor for API requests only
    const interceptor = axios.interceptors.request.use(config => {
      // Direct approach: Only add token if the request is for our backend
      // We check if it's a relative path OR starts with our API_URL
      const isMyBackend = config.url.startsWith('/') || (API_URL && config.url.startsWith(API_URL));

      if (token && isMyBackend) {
        config.headers['x-auth-token'] = token;
      }
      return config;
    }, error => Promise.reject(error));

    const loadUser = async () => {
      if (token) {
        try {
          const res = await axios.get(`${API_URL}/api/auth`);
          setUser(res.data);
        } catch (err) {
          console.error(err);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();

    return () => axios.interceptors.request.eject(interceptor);
  }, [token, API_URL]);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || err.message;
      console.error("Login Error:", errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, { name, email, password, role });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
