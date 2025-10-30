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
  // Helper: safely check whether a token is a decodable JWT and not expired
  const isJwtTokenValid = (token: string | null) => {
    if (!token) return false;
    try {
      const decoded: any = (jwt_decode as any)(token);
      const currentTime = Date.now() / 1000;
      if (decoded && typeof decoded === 'object' && decoded.exp) {
        return decoded.exp > currentTime;
      }
      // If token decodes but has no exp claim, treat it as invalid for safety
      return false;
    } catch (err) {
      // not a decodable JWT
      return false;
    }
  };

  // Check for existing session on mount. Only restore if we have a decodable,
  // non-expired JWT stored in `googleToken`. Do NOT fall back to trusting a
  // stored `user` without a valid token — that causes accidental auto-login.
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    const storedToken = sessionStorage.getItem('googleToken');

    if (isJwtTokenValid(storedToken)) {
      // token is valid; restore both token and user (if parseable)
      setAuthToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse stored user; clearing stored auth.', e);
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('googleToken');
        }
      }
    } else if (storedToken && storedUser) {
  
      try {
        setAuthToken(storedToken);
        setUser(JSON.parse(storedUser));
  console.warn('Restoring non-JWT token from sessionStorage; token not validated client-side.');
      } catch (e) {
          console.error('Failed to parse stored user for non-JWT token; clearing stored auth.', e);
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('googleToken');
      }
    } else {
      // No valid JWT and nothing safe to restore — clear any leftover auth to
      // avoid accidental sign-in from malformed data.
      if (storedUser || storedToken) {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('googleToken');
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
  sessionStorage.setItem('user', JSON.stringify(userData));
  sessionStorage.setItem('googleToken', credential);
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
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('googleToken', token);
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
        sessionStorage.setItem('user', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist updated user to sessionStorage', e);
      }
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('googleToken');
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
