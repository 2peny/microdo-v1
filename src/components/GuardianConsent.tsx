import React, { useEffect, useState } from 'react';
import { ScholarUser } from '../types';
import {
  GuardianLink,
  getGuardianLink,
  isCurrentEmailVerified,
  refreshCurrentEmailVerification,
  sendAccountVerificationEmail,
  updateGuardianLink,
} from '../lib/firebase';

interface GuardianConsentProps {
  requestId: string;
  currentUser: ScholarUser | null;
  onSignIn: () => void;
  onReturn: () => void;
}

export const GuardianConsent: React.FC<GuardianConsentProps> = ({
  requestId,
  currentUser,
  onSignIn,
  onReturn,
}) => {
  const [link, setLink] = useState<GuardianLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(isCurrentEmailVerified());

  useEffect(() => {
    let cancelled = false;
    if (!currentUser || !currentUser.roles?.includes('LEARNER') || !emailVerified) {
      setLink(null);
      setError(
        currentUser?.roles?.includes('LEARNER') && !emailVerified
          ? 'Verify the learner account email before reviewing a guardian request.'
          : null
      );
      return () => { cancelled = true; };
    }
    setIsLoading(true);
    setError(null);
    getGuardianLink(requestId)
      .then((value) => {
        if (!cancelled) setLink(value);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setLink(null);
          setError(loadError instanceof Error ? loadError.message : 'This request is unavailable.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentUser, emailVerified, requestId]);

  const update = async (status: 'APPROVED' | 'REJECTED') => {
    if (!link || !currentUser) return;
    setIsLoading(true);
    setError(null);
    try {
      await updateGuardianLink(
        link,
        status,
        status === 'APPROVED' ? currentUser.fullName : undefined
      );
      setLink({
        ...link,
        status,
        learnerId: status === 'APPROVED' ? currentUser.id : undefined,
        learnerDisplayName: status === 'APPROVED' ? currentUser.fullName : undefined,
      });
      setNotice(status === 'APPROVED'
        ? 'Guardian access approved. You can revoke it later from the relationship workspace.'
        : 'Request declined.');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'The request could not be updated.');
    } finally {
      setIsLoading(false);
    }
  };

  const canDecide = currentUser?.roles?.includes('LEARNER') === true &&
    emailVerified &&
    link?.status === 'PENDING' &&
    link.learnerEmail === currentUser.email;

  const sendVerification = async () => {
    setError(null);
    try {
      await sendAccountVerificationEmail();
      setNotice('Verification email sent. After verifying, sign out and back in, then return to this link.');
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : 'Verification email could not be sent.');
    }
  };

  const refreshVerification = async () => {
    setError(null);
    try {
      const verified = await refreshCurrentEmailVerification();
      setEmailVerified(verified);
      if (!verified) setError('The email is not verified yet. Open the verification email, then try again.');
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : 'Verification status could not be checked.');
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f8fa] px-4 py-10 text-slate-800">
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-700">MicroDo account consent</p>
        <h1 className="mt-2 text-2xl font-semibold">Guardian access request</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Approving gives this guardian access to the relationship status and any limited summary fields shown by MicroDo. It does not grant access to your source documents, password, quizzes, or account.
        </p>

        {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {notice && <p role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

        {!currentUser || !currentUser.roles?.includes('LEARNER') ? (
          <div className="mt-6 rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-700">Sign in or switch to the learner account whose verified email received the request.</p>
            <button type="button" onClick={onSignIn} className="mt-4 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-600">
              Sign in or switch account
            </button>
          </div>
        ) : !emailVerified ? (
          <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
            Verify this learner account’s email before reviewing the request.
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" onClick={() => void sendVerification()} className="font-semibold underline">
                Send verification email
              </button>
              <button type="button" onClick={() => void refreshVerification()} className="font-semibold underline">
                Check verification
              </button>
            </div>
          </div>
        ) : isLoading && !link ? (
          <p className="mt-6 text-sm text-slate-500">Checking the request…</p>
        ) : link ? (
          <div className="mt-6 rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-700">
              Request for: <span className="font-medium">{link.learnerEmail}</span>
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Status: {link.status}
            </p>
            {canDecide ? (
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" disabled={isLoading} onClick={() => void update('APPROVED')} className="rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50">
                  Approve guardian
                </button>
                <button type="button" disabled={isLoading} onClick={() => void update('REJECTED')} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
                  Decline
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                This request can only be decided by the learner account that owns the verified email address.
              </p>
            )}
          </div>
        ) : null}

        <p className="mt-5 text-xs leading-5 text-slate-500">
          Learner approval does not independently establish legal guardianship. Additional consent verification may be required for minors.
        </p>
        <button type="button" onClick={onReturn} className="mt-6 text-sm font-medium text-indigo-700 hover:underline">
          Return to MicroDo
        </button>
      </section>
    </main>
  );
};
