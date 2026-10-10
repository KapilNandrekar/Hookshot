import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('hookshot_token'));
  const [email, setEmail] = useState(() => localStorage.getItem('hookshot_email') || '');

  function login(newToken, userEmail) {
    localStorage.setItem('hookshot_token', newToken);
    localStorage.setItem('hookshot_email', userEmail);
    setToken(newToken);
    setEmail(userEmail);
  }

  function logout() {
    localStorage.removeItem('hookshot_token');
    localStorage.removeItem('hookshot_email');
    setToken(null);
    setEmail('');
  }

  return (
    <AuthContext.Provider value={{ token, email, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
