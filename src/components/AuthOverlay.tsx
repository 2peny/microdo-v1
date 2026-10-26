import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  LogOut,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { ScholarUser, ScholarArchetype } from '../types';
import {
  ARCHETYPES,
  saveStoredUser,
} from '../utils/authStorage';
import {
  registerWithFirebase,
  loginWithFirebase,
  signInWithGooglePopup,
  signOutScholar,
  sendAccountVerificationEmail,
  requestPasswordReset,
} from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

interface AuthOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ScholarUser | null;
  onLoginSuccess: (user: ScholarUser | null) => void;
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
  const [identifier, setIdentifier] = useState(''); // email or username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration Extra Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState<ScholarArchetype>('midnight_owl');
  const [majorFocus, setMajorFocus] = useState('Computer Systems');
  const [registrationRole, setRegistrationRole] = useState<'scholar' | 'guardian'>('scholar');

  // UI States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Password Strength Calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'text-slate-400', bar: 'w-0 bg-slate-300' };
    if (pass.length < 6) return { score: 1, label: 'Too short', color: 'text-amber-700', bar: 'w-1/4 bg-amber-500' };
    if (pass.length < 8) return { score: 2, label: 'Fair', color: 'text-sky-700', bar: 'w-2/4 bg-sky-600' };
    if (pass.length < 12) return { score: 3, label: 'Good', color: 'text-indigo-700', bar: 'w-3/4 bg-indigo-600' };
    return { score: 4, label: 'Strong', color: 'text-emerald-700', bar: 'w-full bg-emerald-600' };
  };

  const handlePasswordReset = async () => {
    setErrorMsg(null);
    setResetNotice(null);
    try {
      await requestPasswordReset(identifier);
      setResetNotice('If an account matches that address, a password reset link will be sent.');
    } catch (resetError) {
      setErrorMsg(resetError instanceof Error ? resetError.message : 'The password reset request failed.');
    }
  };

  const strength = getPasswordStrength(password);
  const activeArchetypeObj = ARCHETYPES[selectedArchetype];

  // Helper for immediate local scholar access (fallback when Firebase is unconfigured locally)
  const handleLocalScholarAccess = (customName?: string, customEmail?: string) => {
    const defaultArchetype: ScholarArchetype = selectedArchetype || 'midnight_owl';
    const detail = ARCHETYPES[defaultArchetype] || ARCHETYPES.midnight_owl;
    const scholarName = customName || fullName.trim() || 'Alex Scholar';
    const scholarEmail = customEmail || email.trim() || identifier.trim() || 'scholar.local@microdo.space';
    const scholarUsername = username.trim() || scholarEmail.split('@')[0] || 'scholar_local';

    const localScholar: ScholarUser = {
      id: `local-${Date.now().toString(36)}`,
      email: scholarEmail,
      fullName: scholarName,
      username: scholarUsername,
      role: 'scholar',
      archetype: defaultArchetype,
      archetypeLabel: detail.label,
      avatarEmoji: detail.emoji,
      majorOrFocus: majorFocus || 'Computer Systems',
      joinedAt: new Date().toISOString().split('T')[0],
    };

    saveStoredUser(localScholar);
    setSuccessNotice(`Unlocked session as Local Scholar: ${localScholar.fullName}!`);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsGoogleSubmitting(false);
      onLoginSuccess(localScholar);
      onClose();
    }, 450);
  };

  // Map Firebase errors to human friendly text
  const formatAuthError = (err: any): string => {
    const code = err?.code || '';
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

    if (code === 'auth/unauthorized-domain') {
      return `Domain "${host}" is not authorized for sign-in in Firebase project (${firebaseConfig.projectId}). Add it in Firebase Console or use the clearly labelled guest option.`;
    }
    if (code === 'auth/operation-not-allowed') {
      return `Email/Password sign-in is disabled in Firebase project (${firebaseConfig.projectId}). Enable it in Firebase Console or use the clearly labelled guest option.`;
    }
    if (code === 'auth/email-already-in-use') {
      return 'Account registration could not be completed. Try signing in or use password recovery.';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Invalid email or password. Please verify your credentials.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    if (code === 'auth/weak-password') {
      return 'Password should be at least 6 characters.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Google sign-in popup was closed before completing.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Network issue connecting to authentication service. Please check your connection.';
    }
    return 'Authentication failed. Please try again.';
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setAuthErrorCode(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const cleanIdent = identifier.trim().toLowerCase();
        if (!cleanIdent || !cleanIdent.includes('@')) {
          setErrorMsg('Please enter your registered email address.');
          setIsSubmitting(false);
          return;
        }
        if (!password) {
          setErrorMsg('Please enter your password.');
          setIsSubmitting(false);
          return;
        }

        let authenticatedUser: ScholarUser;
        try {
          authenticatedUser = await loginWithFirebase(cleanIdent, password);
        } catch (firebaseErr: any) {
          if (
            firebaseErr?.code === 'auth/operation-not-allowed' ||
            firebaseErr?.code === 'auth/unauthorized-domain'
          ) {
            setAuthErrorCode(firebaseErr.code);
            setErrorMsg(formatAuthError(firebaseErr));
            setIsSubmitting(false);
            return;
          }
          throw firebaseErr;
        }

        saveStoredUser(authenticatedUser);
        setSuccessNotice(`Welcome back, ${authenticatedUser.fullName}!`);
        setTimeout(() => {
          setIsSubmitting(false);
          onLoginSuccess(authenticatedUser);
          onClose();
        }, 500);
      } else if (mode === 'register') {
        const cleanName = fullName.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanUsername = username.trim().toLowerCase() || cleanEmail.split('@')[0];

        if (!cleanName) {
          setErrorMsg('Please enter your full name.');
          setIsSubmitting(false);
          return;
        }
        if (!cleanEmail || !cleanEmail.includes('@')) {
          setErrorMsg('Please provide a valid email address.');
          setIsSubmitting(false);
          return;
        }
        if (!password || password.length < 6) {
          setErrorMsg('Password must be at least 6 characters.');
          setIsSubmitting(false);
          return;
        }

        const newUser = await registerWithFirebase({
          email: cleanEmail,
          password,
          fullName: cleanName,
          username: cleanUsername,
          archetype: selectedArchetype,
          majorOrFocus: majorFocus || 'Computer Systems',
          role: registrationRole,
        });
        let verificationNotice = '';
        try {
          await sendAccountVerificationEmail();
          verificationNotice = ' Check your email to verify the account before requesting or approving guardian links.';
        } catch {
          verificationNotice = ' The account was created, but the verification email could not be sent. You can request another from the guardian workspace.';
        }

        saveStoredUser(newUser);
        setSuccessNotice(`Account created for ${newUser.fullName}.${verificationNotice}`);
        setTimeout(() => {
          setIsSubmitting(false);
          onLoginSuccess(newUser);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      console.error('Authentication failed', { code: err?.code || 'unknown' });
      setAuthErrorCode(err?.code || null);
      setErrorMsg(formatAuthError(err));
      setIsSubmitting(false);
    }
  };

  // Google Popup Sign In Handler
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setAuthErrorCode(null);
    setIsGoogleSubmitting(true);
    try {
      const googleUser = await signInWithGooglePopup(
        registrationRole
      );
      saveStoredUser(googleUser);
      setSuccessNotice(`Signed in with Google as ${googleUser.fullName}!`);
      setTimeout(() => {
        setIsGoogleSubmitting(false);
        onLoginSuccess(googleUser);
        onClose();
      }, 500);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthErrorCode(err?.code || null);
        setErrorMsg(formatAuthError(err));
      }
      setIsGoogleSubmitting(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await signOutScholar();
      saveStoredUser(null);
      onLoginSuccess(null);
      setSuccessNotice('Signed out successfully.');
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign out');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/45 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col"
      >
        <div className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-slate-500">MicroDo account</span>
              <h2 id="auth-modal-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                  {mode === 'login' ? 'Sign in' : 'Create your account'}
                </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
              title="Close overlay"
              aria-label="Close authentication modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex gap-5 border-b border-slate-100 text-sm">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              className={`border-b-2 pb-2 font-medium transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'border-indigo-600 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(null); }}
              className={`border-b-2 pb-2 font-medium transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'border-indigo-600 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Register
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
            {resetNotice && (
              <div role="status" className="rounded-lg border border-indigo-200 bg-indigo-50 p-2.5 text-xs text-indigo-800">
                {resetNotice}
              </div>
            )}
          </AnimatePresence>

          {/* Error Banner */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {authErrorCode === 'auth/unauthorized-domain' ? (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-2.5 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block text-amber-950 font-sans">
                            Domain &quot;{typeof window !== 'undefined' ? window.location.hostname : 'localhost'}&quot; Not Authorized
                          </span>
                          <span className="text-amber-800 text-[11px] leading-relaxed block mt-0.5">
                            Firebase Authentication blocks Google Sign-In because this domain is not on your project&apos;s Authorized Domains list.
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setErrorMsg(null); setAuthErrorCode(null); }}
                        className="text-amber-500 hover:text-amber-700 cursor-pointer p-0.5"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60">
                      <a
                        href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-[11px] transition-colors shadow-xs"
                      >
                        <span>Add domain in Firebase Console</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleLocalScholarAccess('Google Scholar (Local)', 'scholar.google@microdo.space')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-100/50 text-amber-900 font-medium text-[11px] border border-amber-300 transition-colors cursor-pointer"
                      >
                        <span>Continue as Local Scholar</span>
                      </button>
                    </div>
                  </div>
                ) : authErrorCode === 'auth/operation-not-allowed' ? (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-2.5 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block text-amber-950 font-sans">
                            Firebase Email/Password Disabled
                          </span>
                          <span className="text-amber-800 text-[11px] leading-relaxed block mt-0.5">
                            Email authentication is disabled in Firebase console for project <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-[10px]">{firebaseConfig.projectId}</code>.
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setErrorMsg(null); setAuthErrorCode(null); }}
                        className="text-amber-500 hover:text-amber-700 cursor-pointer p-0.5"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60">
                      <a
                        href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-[11px] transition-colors shadow-xs"
                      >
                        <span>Enable in Firebase Console</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleLocalScholarAccess()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-100/50 text-amber-900 font-medium text-[11px] border border-amber-300 transition-colors cursor-pointer"
                      >
                        <span>Continue as Local Scholar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="font-medium font-sans">{errorMsg}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setErrorMsg(null); setAuthErrorCode(null); }}
                      className="text-rose-500 hover:text-rose-700 cursor-pointer"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Google Sign In */}
          {mode === 'login' && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <label htmlFor="google-new-account-role" className="mb-1 block text-xs font-semibold text-slate-700">
                Account type for a new Google account
              </label>
              <select
                id="google-new-account-role"
                value={registrationRole}
                onChange={(event) => setRegistrationRole(event.target.value as 'scholar' | 'guardian')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="scholar">Learner</option>
                <option value="guardian">Parent / Guardian</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                Existing Google accounts keep their current role. This choice is used only if you are creating a new account.
              </p>
            </div>
          )}
          <button
            type="button"
            disabled={isGoogleSubmitting || isSubmitting}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-all shadow-xs flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
          >
            {isGoogleSubmitting ? (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] text-slate-400 font-mono uppercase tracking-wider">
              or with password
            </span>
          </div>

          {/* FORM: LOGIN OR REGISTER */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* REGISTER FIELDS */}
            {mode === 'register' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. your real name"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-900 placeholder:text-slate-400 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-900 placeholder:text-slate-400 bg-white"
                      />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Username / Handle
                    </label>
                    <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-900 placeholder:text-slate-400 bg-white"
                      />
                  </div>
                </div>

                <div>
                  <label htmlFor="registration-role" className="block text-xs font-semibold text-slate-700 mb-1">
                    Create a learner or guardian account
                  </label>
                  <select
                    id="registration-role"
                    value={registrationRole}
                    onChange={(event) => setRegistrationRole(event.target.value as 'scholar' | 'guardian')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs text-slate-900 bg-white"
                  >
                    <option value="scholar">Learner</option>
                    <option value="guardian">Parent / Guardian</option>
                  </select>
                  {registrationRole === 'guardian' && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Learner access is available only after the learner approves your request.
                    </p>
                  )}
                </div>

                {/* Archetype Picker */}
                <div>
                  <label htmlFor="study-style-archetype" className="mb-1 block text-xs font-semibold text-slate-700">
                    Study style
                  </label>
                  <select
                    id="study-style-archetype"
                    value={selectedArchetype}
                    onChange={(event) => setSelectedArchetype(event.target.value as ScholarArchetype)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {(Object.keys(ARCHETYPES) as ScholarArchetype[]).map((key) => (
                      <option key={key} value={key}>{ARCHETYPES[key].label}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">{activeArchetypeObj.trait}</p>
                </div>

                {/* Academic Focus / Major */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discipline / Field of Study
                  </label>
                  <input
                      type="text"
                      value={majorFocus}
                      onChange={(e) => setMajorFocus(e.target.value)}
                      placeholder="e.g. Computer Science, Medicine, Law"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-900 placeholder:text-slate-400 bg-white"
                    />
                </div>
              </div>
            )}

            {/* LOGIN FIELDS */}
            {mode === 'login' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                    type="email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-900 placeholder:text-slate-400 bg-white"
                  />
                <button
                  type="button"
                  onClick={() => void handlePasswordReset()}
                  className="mt-2 text-[11px] font-medium text-indigo-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* PASSWORD FIELD */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <span className={`text-[10px] ${strength.color}`}>
                  {strength.label}
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (min 6 characters)"
                  className="w-full px-3 pr-10 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-900 placeholder:text-slate-400 bg-white"
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
                disabled={isSubmitting || isGoogleSubmitting}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold text-sm transition-colors disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign in' : 'Create account'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Bottom Switcher */}
            <div className="flex items-center justify-center text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span>Secure account access</span>
            </div>

            {/* Offline / Local Scholar Quick Option */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => handleLocalScholarAccess('Scholar (Guest)', 'guest.scholar@microdo.space')}
                className="inline-flex items-center text-[11px] font-medium text-slate-500 hover:text-indigo-700 transition-colors py-1 px-2 cursor-pointer"
              >
                <span>Continue as a guest (local mode)</span>
              </button>
            </div>

          </form>
        </div>

        {/* Current Active User Status Bar */}
        {currentUser && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs flex items-center justify-between text-slate-600 shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="text-base">{currentUser.avatarEmoji}</span>
              <span className="font-semibold text-slate-800 truncate">{currentUser.fullName}</span>
              <span className="text-slate-400 font-mono text-[10px]">({currentUser.email})</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                Active Session
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
