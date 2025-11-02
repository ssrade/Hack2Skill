import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import * as jwt_decode from 'jwt-decode';

interface User {
  id: string | number;
  email: string;
  name: string;
  profilePhoto?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isLoading: boolean;
  authToken: string | null;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper: check if JWT token is valid and not expired
  const isTokenValid = (token: string | null): boolean => {
    if (!token) return false;
    
    try {
      const decoded: any = jwt_decode.jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token has expiry and is not expired
      if (decoded && decoded.exp) {
        return decoded.exp > currentTime;
      }
      
      // If no exp claim, treat as invalid
      return false;
    } catch (err) {
      console.error('Token validation error:', err);
      return false;
    }
  };

  // Initialize auth state from storage on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        // Validate token first
        if (storedToken && isTokenValid(storedToken)) {
          setAuthToken(storedToken);
          
          // Parse and set user if available
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          }
        } else {
          // Token invalid or expired, clear storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Set up token expiry check
  useEffect(() => {
    if (!authToken) return;

    // Check token validity every minute
    const intervalId = setInterval(() => {
      if (!isTokenValid(authToken)) {
        console.warn('Token expired, logging out');
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [authToken]);

  // Login function - receives token and user data from backend
  const login = (token: string, userData: User) => {
    try {
      // Validate token
      if (!isTokenValid(token)) {
        throw new Error('Invalid token received');
      }

      // Store token and user
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setAuthToken(token);
      setUser(userData);
      
      console.log('User logged in successfully:', userData.email);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Update user data
  const updateUser = (userData: User) => {
    try {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    console.log('User logged out');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && !!authToken,
    login,
    logout,
    isLoading,
    authToken,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};