import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Database,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Download,
  Copy,
  Check,
  GraduationCap
} from 'lucide-react';
import { ScholarUser, ScholarArchetype } from '../types';
import { ARCHETYPES } from '../utils/authStorage';

interface AuthOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ScholarUser | null;
  onLoginSuccess: (user: ScholarUser) => void;
  initialMode?: 'login' | 'register';
}

type AuthMode = 'login' | 'register';

export const AuthOverlay: React.FC<AuthOverlayProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form Fields
  const [identifier, setIdentifier] = useState(''); // username or email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration Extra Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState<ScholarArchetype>('midnight_owl');
  const [majorFocus, setMajorFocus] = useState('Computer Systems');

  // UI States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Password Strength Calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Uninked', color: 'text-slate-400', bar: 'w-0 bg-slate-300' };
    if (pass.length < 5) return { score: 1, label: '✏️ Pencil Scribble (Weak)', color: 'text-amber-500', bar: 'w-1/4 bg-amber-400' };
    if (pass.length < 8) return { score: 2, label: '🖋️ Fountain Pen (Moderate)', color: 'text-blue-500', bar: 'w-2/4 bg-blue-500' };
    if (pass.length < 12) return { score: 3, label: '📜 Wax-Sealed Scroll (Strong)', color: 'text-indigo-600', bar: 'w-3/4 bg-indigo-600' };
    return { score: 4, label: '🏛️ Iron Library Vault (Legendary)', color: 'text-emerald-600', bar: 'w-full bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);
  const activeArchetypeObj = ARCHETYPES[selectedArchetype];

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const cleanIdent = identifier.trim().toLowerCase();
        if (!cleanIdent) {
          setErrorMsg('Please enter your scholar email or username.');
          setIsSubmitting(false);
          return;
        }
        if (!password || password.length < 4) {
          setErrorMsg('Password must be at least 4 characters.');
          setIsSubmitting(false);
          return;
        }

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: cleanIdent, password }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          setErrorMsg(data.error || 'Authentication failed');
          setIsSubmitting(false);
          return;
        }

        const authenticatedUser = {
          ...data.user,
          fullName: data.user.full_name,
          majorOrFocus: data.user.major_focus,
          avatarEmoji: data.user.avatar_emoji,
          joinedAt: data.user.created_at,
        };

        setSuccessNotice(`Welcome back, ${authenticatedUser.fullName}! Station clearance verified.`);
        setTimeout(() => {
          setIsSubmitting(false);
          onLoginSuccess(authenticatedUser);
          onClose();
        }, 600);
      } else if (mode === 'register') {
        const cleanName = fullName.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanUsername = username.trim().toLowerCase() || cleanEmail.split('@')[0];

        if (!cleanName || !cleanEmail || !cleanEmail.includes('@') || !password || password.length < 4) {
          setErrorMsg('Please fill out all fields correctly.');
          setIsSubmitting(false);
          return;
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: cleanUsername,
            email: cleanEmail,
            full_name: cleanName,
            password_hash: password,
            archetype: selectedArchetype,
            avatar_emoji: activeArchetypeObj.emoji,
            major_focus: majorFocus || 'Computer Science'
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Registration failed');
          setIsSubmitting(false);
          return;
        }

        // After successful registration, log them in automatically
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: cleanUsername, password }),
        });
        
        const loginData = await loginRes.json();
        
        if (loginRes.ok && loginData.user) {
          const newUser = {
            ...loginData.user,
            fullName: loginData.user.full_name,
            majorOrFocus: loginData.user.major_focus,
            avatarEmoji: loginData.user.avatar_emoji,
            joinedAt: loginData.user.created_at,
          };
          setSuccessNotice(`Scholar Passport forged for ${newUser.fullName}! Entry stamped.`);
          setTimeout(() => {
            setIsSubmitting(false);
            onLoginSuccess(newUser);
            onClose();
          }, 600);
        } else {
          setSuccessNotice('Registered successfully! Please log in.');
          setMode('login');
          setIsSubmitting(false);
        }
      }
    } catch (err: any) {
      setErrorMsg('Network error or server offline: ' + err.message);
      setIsSubmitting(false);
    }
  };


  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col"
      >
        {/* Quirky Tactile Header Ribbon */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 shrink-0 relative overflow-hidden">
          {/* Subtle background circuit watermark */}
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-indigo-500/10 pointer-events-none blur-xl" />
          <div className="absolute right-12 bottom-2 text-6xl opacity-10 select-none font-mono font-black pointer-events-none">
            01
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center text-xl shadow-inner">
                {mode === 'register' ? activeArchetypeObj.emoji : '🎓'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono tracking-widest text-indigo-300 uppercase font-semibold">
                    Station Clearance Codex
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-mono rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    SQL READY
                  </span>
                </div>
                <h2 id="auth-modal-title" className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">
                  {mode === 'login' && 'Sign In to Study Station'}
                  {mode === 'register' && 'Forge Scholar Passport'}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close overlay"
              aria-label="Close authentication modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quirky Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 mt-4 p-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all text-center cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(null); }}
              className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all text-center cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Register New Scholar
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Success Banner */}
          <AnimatePresence>
            {successNotice && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium font-sans">{successNotice}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Banner */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="font-medium font-sans">{errorMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMsg(null)}
                  className="text-rose-500 hover:text-rose-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FORM: LOGIN OR REGISTER */}
          <form onSubmit={handleSubmit} className="space-y-4">


              {/* REGISTER EXTRA: Scholar Name & Email */}
              {mode === 'register' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Scholar Alias / Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Hypatia of Alexandria"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-900 placeholder:text-slate-400 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Academic / Personal Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="scholar@nodegrid.space"
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-900 placeholder:text-slate-400 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Station Handle / Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <span className="font-mono text-xs">@</span>
                        </div>
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="hypatia"
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-900 placeholder:text-slate-400 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quirky Scholar Archetype Picker */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Choose Your Study Archetype</span>
                      <span className="text-[10px] font-mono text-indigo-600 font-normal">
                        {activeArchetypeObj.trait}
                      </span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(Object.keys(ARCHETYPES) as ScholarArchetype[]).map((key) => {
                        const item = ARCHETYPES[key];
                        const isSelected = selectedArchetype === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedArchetype(key)}
                            className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{item.emoji}</span>
                              <span className={`text-xs font-semibold truncate ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                {item.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-1 font-mono">
                              {item.motto}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Major / Focus Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Academic Focus / Major
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={majorFocus}
                        onChange={(e) => setMajorFocus(e.target.value)}
                        placeholder="e.g. Distributed Systems & Compilers"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-900 placeholder:text-slate-400 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* LOGIN FIELDS */}
              {mode === 'login' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scholar Email or Station Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="ada@nodegrid.space or ada.lovelace"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-900 placeholder:text-slate-400 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* PASSWORD FIELD (Common to both) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Station Password
                  </label>
                  <span className={`text-[10px] font-mono ${strength.color}`}>
                    {strength.label}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (e.g. microdo2026)"
                    className="w-full pl-9 pr-10 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-900 placeholder:text-slate-400 bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength bar */}
                <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5 overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${strength.bar}`} />
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 group"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Authenticate & Enter' : 'Forge Passport & Enter'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              {/* Bottom Quirky Stamp */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Encrypted session · LocalStorage &amp; SQL sync</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setErrorMsg(null);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors cursor-pointer text-xs"
                >
                  {mode === 'login' ? 'Need a new passport? Register' : 'Already have one? Sign in'}
                </button>
              </div>
            </form>
        </div>

        {/* Current Active User Status Bar (If user is logged in) */}
        {currentUser && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs flex items-center justify-between text-slate-600 shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="text-base">{currentUser.avatarEmoji}</span>
              <span className="font-semibold text-slate-800 truncate">{currentUser.fullName}</span>
              <span className="text-slate-400 font-mono text-[10px]">({currentUser.email})</span>
            </div>
            <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 shrink-0">
              Active Passport
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
