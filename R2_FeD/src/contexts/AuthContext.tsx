import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import * as jwt_decode from 'jwt-decode';

interface User {
  email: string;
  name: string;
  picture: string;
  sub: string; // Google user ID
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credential: string) => void;
  // set user from a Google profile (when you only have access_token)
  setUserFromProfile: (profile: any, token: string) => void;
  // update profile locally (and optionally send to backend later)
  updateProfile: (patch: Partial<User>) => void;
  // current raw token (id token or access token) if available
  authToken: string | null;
  logout: () => void;
  isLoading: boolean;
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

  // Check for existing session on mount
  useEffect(() => {
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('googleToken');
  if (storedToken) setAuthToken(storedToken);
    
    if (storedUser) {
      if (storedToken) {
        try {
          // Try to decode as an ID token (JWT). If it decodes, verify expiry.
          const decoded: any = (jwt_decode as any)(storedToken);
          const currentTime = Date.now() / 1000;

          if (decoded?.exp && decoded.exp > currentTime) {
            setUser(JSON.parse(storedUser));
          } else if (decoded?.exp && decoded.exp <= currentTime) {
            // Token expired, clear storage
            localStorage.removeItem('user');
            localStorage.removeItem('googleToken');
          } else {
            // No exp present (or unknown shape) — fall back to stored user
            setUser(JSON.parse(storedUser));
          }
        } catch (error) {
          // Not a decodeable JWT (likely an access_token). Assume stored user is valid.
          console.warn('Stored token is not a JWT; assuming stored user is valid.', error);
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Failed to parse stored user:', e);
            localStorage.removeItem('user');
            localStorage.removeItem('googleToken');
          }
        }
      } else {
        // No stored token but a stored user exists — restore user
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse stored user:', e);
          localStorage.removeItem('user');
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = (credential: string) => {
    try {
      const decoded: any = (jwt_decode as any)(credential);

      const userData: User = {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        sub: decoded.sub,
      };

      setUser(userData);
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('googleToken', credential);
  setAuthToken(credential);

      console.log('User logged in:', userData);
    } catch (error) {
      console.error('Error decoding credential:', error);
    }
  };

  // When we only have an access_token (no ID token/credential), fetch or accept
  // the Google userinfo object and set the user from that profile.
  const setUserFromProfile = (profile: any, token: string) => {
    try {
      const userData: User = {
        email: profile.email,
        name: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
        picture: profile.picture || profile.avatar || '',
        sub: profile.sub || profile.id || '',
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('googleToken', token);
  setAuthToken(token);

      console.log('User set from profile:', userData);
    } catch (error) {
      console.error('Error setting user from profile:', error);
    }
  };

  const updateProfile = (patch: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      try {
        localStorage.setItem('user', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist updated user to localStorage', e);
      }
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('googleToken');
    console.log('User logged out');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    setUserFromProfile,
    updateProfile,
    authToken,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
