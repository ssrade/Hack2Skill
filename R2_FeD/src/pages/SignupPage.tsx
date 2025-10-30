import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { CheckCircle, Globe, Languages, Scale, Lock, Sparkles } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { motion } from 'framer-motion';
import { cn } from '../components/lib/utils';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SignupPageProps {
  onSignup: () => void;
  onSwitchToLogin: () => void;
}

export function SignupPage({ onSignup, onSwitchToLogin }: SignupPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { login, setUserFromProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      console.error('Passwords do not match');
      return;
    }
    // Traditional email/password signup (to be implemented with backend)
    if (name && email && password) {
      console.log('Traditional signup not yet implemented');
      // onSignup();
    }
  };

  const googleSignup = useGoogleLogin({
    onSuccess: async (response: any) => {
      if (response?.credential) {
        login(response.credential);
        navigate('/app');
        return;
      }

      if (response?.access_token) {
        try {
          const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${response.access_token}`);
          if (!res.ok) throw new Error(`userinfo fetch failed: ${res.status}`);
          const profile = await res.json();
          setUserFromProfile(profile, response.access_token);
          navigate('/app');
          return;
        } catch (err) {
          console.error('Failed to fetch Google profile:', err);
        }
      }

      console.error('No credential or access_token returned from Google signup', response);
    },
    onError: () => {
      console.error('Google signup failed');
    },
  });

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

        {/* Signup Card */}
        <div className="bg-white/80 dark:bg-[#1a1f3a]/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800/50 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-black dark:text-white text-xl mb-6 text-center">Create Your Account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="bg-white dark:bg-[#0f1629] border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500"
                required
              />
            </div>

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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white dark:bg-[#0f1629] border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white dark:bg-[#0f1629] border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 rounded border-gray-400 dark:border-gray-700" required />
              <label className="text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                  Privacy Policy
                </a>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white h-11"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create Account
            </Button>
          </form>

          {/* --- OR Separator --- */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
            <span className="text-gray-500 dark:text-gray-400 text-xs">OR</span>
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
          </div>

          {/* --- Google Sign-Up Button --- */}
          <div className="w-full flex items-center justify-center">
            <Button
              type="button"
              onClick={() => googleSignup()}
              className="w-full bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center h-11 transition-all duration-300"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
                <path fill="#4CAF50" d="m24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.108-11.283-7.404l-6.571 4.819C9.656 39.663 16.318 44 24 44z" />
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C39.756 34.631 44 27.925 44 20c0-1.341-.138-2.65-.389-3.917z" />
              </svg>
              Sign Up with Google
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Features */}
        {/* <motion.div
          className="flex items-center justify-center gap-4 mt-12 text-gray-600 dark:text-gray-400 text-sm flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800/40 px-3 py-1.5 rounded-full">
            <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800/40 px-3 py-1.5 rounded-full">
            <Globe className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span>10,000+ professionals</span>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800/40 px-3 py-1.5 rounded-full">
            <Lock className="w-4 h-4 text-yellow-500 dark:text-amber-400" />
            <span>Bank-level security</span>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800/40 px-3 py-1.5 rounded-full">
            <Languages className="w-4 h-4 text-yellow-500 dark:text-amber-400" />
            <span>Multi-Lingual Support</span>
          </div>
        </motion.div> */}
      </div>
    </div>
  );
}