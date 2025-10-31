import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Scale, Sparkles, Loader2, Eye, EyeOff } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { motion } from 'framer-motion';
import { cn } from '../components/lib/utils';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { login, googleLogin } from '../api/authApi';

interface LoginPageProps {
  onLogin: () => void;
  onSwitchToSignup: () => void;
}

export function LoginPage({ onLogin, onSwitchToSignup }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Call backend login API
      const response = await login({ email, password });
      
      // Response: { token: string, user: { id, email, name, profilePhoto? } }
      const { token, user } = response;

      // Store token in localStorage (used by axios interceptor)
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Update auth context
      authLogin(token, user);

      // Navigate to app
      navigate('/app');
      onLogin();
    } catch (err: any) {
      console.error('Login error:', err);
      const serverMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(serverMsg || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (response: any) => {
      setIsLoading(true);
      setError('');

      try {
        // If we have a credential (ID token)
        if (response?.credential) {
          const backendResponse = await googleLogin({ idToken: response.credential });
          const { token, user } = backendResponse;

          // Store in localStorage (used by axios interceptor)
          localStorage.setItem('authToken', token);
          localStorage.setItem('user', JSON.stringify(user));

          authLogin(token, user);
          navigate('/app');
          onLogin();
          return;
        }

        // If we have an access token, get user info first
        if (response?.access_token) {
          const res = await fetch(
            `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${response.access_token}`
          );
          
          if (!res.ok) throw new Error(`Failed to fetch user info: ${res.status}`);
          
          const profile = await res.json();
          
          // Try to exchange Google token with backend
          await setUserFromProfile(profile, response.access_token);
          navigate('/app');
          onLogin();
          return;
        }

        throw new Error('No credential or access_token returned from Google');
      } catch (err: any) {
        console.error('Google login error:', err);
        const serverMsg = err.response?.data?.error || err.response?.data?.message || err.message;
        setError(serverMsg || 'Failed to sign in with Google');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError('Google sign-in failed. Please try again.');
    },
  });

  async function setUserFromProfile(profile: any, access_token: string) {
    try {
      // Try to exchange the Google access token with the backend
      const candidates = [
        { accessToken: access_token },
        { access_token },
        { idToken: access_token },
      ];
      
      for (const payload of candidates) {
        try {
          const backendResp: any = await googleLogin(payload as any);
          if (backendResp?.token) {
            const { token, user } = backendResp;
            
            // Store in localStorage (used by axios interceptor)
            localStorage.setItem('authToken', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            authLogin(token, user);
            return;
          }
        } catch {
          // ignore and try next payload shape
        }
      }
    } catch (err) {
      console.warn('setUserFromProfile: backend exchange failed', err);
    }

    // Fallback: build a minimal user object from the Google profile
    const maybeUser = {
      id: profile.sub ?? profile.id ?? profile.email,
      email: profile.email,
      name: profile.name ?? (`${profile.given_name ?? ''} ${profile.family_name ?? ''}`.trim() || undefined),
      picture: profile.picture ?? profile.avatar,
    };

    const user = Object.fromEntries(Object.entries(maybeUser).filter(([, v]) => v != null));
    
    // Store in localStorage
    if (access_token) {
      localStorage.setItem('authToken', access_token);
    }
    localStorage.setItem('user', JSON.stringify(user));
    
    // Update auth context
    authLogin(access_token, user);
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-black dark:via-black dark:to-indigo-950",
        "flex items-center justify-center p-4",
        "transition-all duration-300",
        "relative overflow-hidden"
      )}
    >
      {/* Background blobs */}
      <div className="absolute top-44 left-44 w-96 h-66 -translate-x-1/4 -translate-y-1/4 bg-blue-700/50 rounded-full blur-[100px] opacity-20 dark:opacity-40 pointer-events-none z-0"></div>
      <div className="absolute top-20 right-60 w-32 h-32 bg-pink-500 rounded-full blur-3xl opacity-20 dark:opacity-50 pointer-events-none z-0 animate-float-1"></div>
      <div className="absolute bottom-40 left-40 w-24 h-24 bg-teal-500 rounded-full blur-2xl opacity-30 dark:opacity-60 pointer-events-none z-0 animate-float-2"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <h4 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-300 dark:via-indigo-200 dark:to-purple-300 bg-clip-text text-transparent leading-tight">
              LawBuddy AI
            </h4>
          </div>
          <Badge className="bg-white dark:bg-gray-800/60 text-blue-700 dark:text-blue-100 border border-blue-200 dark:border-blue-400/30 px-4 py-1.5 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-300" />
            AI-Powered Legal Intelligence
          </Badge>
        </motion.div>

        {/* Login Card */}
        <div className="bg-white/80 dark:bg-[#1a1f3a]/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800/50 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-black dark:text-white text-xl mb-6 text-center">Welcome Back</h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="bg-white dark:bg-[#0f1629] border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
                <a href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white dark:bg-[#0f1629] border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="rounded border-gray-400 dark:border-gray-700"
              />
              <label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400">
                Remember me for 30 days
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* --- OR Separator --- */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
            <span className="text-gray-500 dark:text-gray-400 text-xs">OR</span>
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
          </div>

          {/* --- Google Sign-In Button --- */}
          <div className="w-full flex items-center justify-center">
            <Button
              type="button"
              onClick={() => handleGoogleLogin()}
              disabled={isLoading}
              className="w-full bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center h-11 transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                    <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
                    <path fill="#4CAF50" d="m24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.108-11.283-7.404l-6.571 4.819C9.656 39.663 16.318 44 24 44z" />
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C39.756 34.631 44 27.925 44 20c0-1.341-.138-2.65-.389-3.917z" />
                  </svg>
                  Sign In with Google
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignup}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                disabled={isLoading}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}