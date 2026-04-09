import React, { useState, useEffect } from "react";
import {
  ArrowUpCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Github,
  Chrome,
} from "lucide-react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { auth } from '../contexts/AuthContext';

const db = getFirestore();
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

interface AuthProps {
  onClose: () => void;
}

export function AuthPages({ onClose }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        sendUserDetailsToBackend(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

  const sendUserDetailsToBackend = async (user: any) => {
    try {
      const idToken = await user.getIdToken();
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: user.displayName || null,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error saving user details:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      const authProvider = provider === 'google' ? googleProvider : githubProvider;
      await signInWithPopup(auth, authProvider);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during social login');
    }
  };

  return (
    <div className="fixed inset-0 bg-charcoal-950/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-md bg-charcoal-950 border border-charcoal-800/50 rounded-2xl shadow-xl p-8 relative overflow-hidden animate-fadeIn">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-blue-500/5" />
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-bronze/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        
        <div className="relative">
          <div className="flex items-center justify-center mb-8">
            <ArrowUpCircle className="w-10 h-10 text-bronze animate-pulse mr-2" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-bronze to-charcoal-800 bg-clip-text text-transparent">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
          </div>

          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className="w-full bg-white text-gray-800 font-medium rounded-lg py-3 flex items-center justify-center space-x-2 hover:bg-gray-100 transition-colors"
            >
              <Chrome className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('github')}
              className="w-full bg-[#24292e] text-white font-medium rounded-lg py-3 flex items-center justify-center space-x-2 hover:bg-[#24292e]/90 transition-colors"
            >
              <Github className="w-5 h-5" />
              <span>Continue with GitHub</span>
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-charcoal-800/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-charcoal-950 text-warmGrey-400">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warmGrey-400 group-focus-within:text-bronze transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full bg-charcoal-900 border border-charcoal-800/50 text-warmGrey-100 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:border-bronze focus:ring-0 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warmGrey-400 group-focus-within:text-bronze transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-charcoal-900 border border-charcoal-800/50 text-warmGrey-100 rounded-lg pl-12 pr-12 py-3 focus:outline-none focus:ring-2 focus:border-bronze focus:ring-0 focus:border-transparent transition-all duration-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warmGrey-400 hover:text-bronze transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {/* TODO: Implement forgot password */}}
                  className="text-sm text-warmGrey-400 hover:text-bronze transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="glow w-full bg-bronze text-charcoal-950 font-bold rounded-lg py-3 flex items-center justify-center space-x-2 hover:bg-bronze/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>

            <div className="text-center text-warmGrey-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-bronze hover:text-bronze/80 transition-colors"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </form>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-warmGrey-400 hover:text-bronze transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}