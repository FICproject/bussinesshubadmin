import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ShieldAlert, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#12102E] via-[#1A1646] to-[#0D1527] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Ambient background glows matching brand aesthetics */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[250px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 left-1/4 w-[300px] h-[200px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-block p-1 bg-white/10 backdrop-blur-md rounded-full shadow-[0_0_30px_rgba(139,92,246,0.35)] mb-4 border border-violet-400/30">
          <img
            src="/logo.jpg"
            alt="Forge India Connect"
            className="w-20 h-20 rounded-full object-cover ring-2 ring-white/20"
          />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">FIC Business Hub</h2>
        <p className="mt-1 text-sm text-amber-300 font-semibold tracking-wide">Forge India Connect</p>
        <p className="mt-0.5 text-xs text-indigo-200/80 font-medium">Internal Administration & Operations</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5),0_0_40px_rgba(139,92,246,0.15)] sm:rounded-2xl border border-white/40">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-sm">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                Staff Email
              </label>
              <div className="mt-1 relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm text-slate-900 bg-slate-50/50 hover:bg-white transition-colors"
                  placeholder="admin@ficapp.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                Password
              </label>
              <div className="mt-1 relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-11 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm text-slate-900 bg-slate-50/50 hover:bg-white transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-150 active:scale-[0.98] cursor-pointer"
              >
                {isLoading ? 'Authenticating...' : 'Sign In to Operations Console'}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-500">
              Authorized FIC personnel only. Activity and IP addresses are audited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
