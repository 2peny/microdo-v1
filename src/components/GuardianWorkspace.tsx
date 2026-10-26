import React, { useCallback, useEffect, useState } from 'react';
import { Link2, LogOut, RefreshCw } from 'lucide-react';
import { ScholarUser } from '../types';
import {
  GuardianLink,
  getGuardianLinks,
  isCurrentEmailVerified,
  requestGuardianLink,
  refreshCurrentEmailVerification,
  sendAccountVerificationEmail,
  updateGuardianLink,
} from '../lib/firebase';

interface GuardianWorkspaceProps {
  currentUser: ScholarUser;
  onSwitchToLearner?: () => void;
  onSignOut: () => Promise<void>;
}

export const GuardianWorkspace: React.FC<GuardianWorkspaceProps> = ({
  currentUser,
  onSwitchToLearner,
  onSignOut,
}) => {
  const [outgoingLinks, setOutgoingLinks] = useState<GuardianLink[]>([]);
  const [incomingLinks, setIncomingLinks] = useState<GuardianLink[]>([]);
  const [learnerEmail, setLearnerEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(isCurrentEmailVerified());

  const canReviewLearnerRequests = currentUser.roles?.includes('LEARNER') === true;

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const verified = await refreshCurrentEmailVerification();
      setEmailVerified(verified);
      const [outgoing, incoming] = await Promise.all([
        getGuardianLinks('guardianId'),
        canReviewLearnerRequests && verified
          ? getGuardianLinks('learnerEmail')
          : Promise.resolve([]),
      ]);
      setOutgoingLinks(outgoing);
      setIncomingLinks(incoming);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Guardian records could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [canReviewLearnerRequests]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setApprovalUrl(null);
    try {
      await requestGuardianLink(learnerEmail);
      const email = learnerEmail.trim().toLowerCase();
      const link = outgoingLinks.find((item) => item.learnerEmail === email);
      const requestId = link?.id || `${currentUser.id}_${email}`;
      const url = new URL(window.location.href);
      url.search = '';
      url.searchParams.set('guardian-consent', requestId);
      setApprovalUrl(url.toString());
      setLearnerEmail('');
      setNotice('Request sent. The learner must sign in with the matching verified email and approve access.');
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The request could not be sent.');
    }
  };

  const handleRelationshipUpdate = async (
    link: GuardianLink,
    status: GuardianLink['status']
  ) => {
    setError(null);
    setNotice(null);
    try {
      await updateGuardianLink(
        link,
        status,
        status === 'APPROVED' ? currentUser.fullName : undefined
      );
      setNotice(status === 'REVOKED' ? 'Access was revoked.' : 'Request updated.');
      await refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'The relationship could not be updated.');
    }
  };

  const sendVerification = async () => {
    setError(null);
    try {
      await sendAccountVerificationEmail();
      setNotice('Verification email sent. After verifying, sign out and back in, then refresh this workspace.');
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : 'Verification email could not be sent.');
    }
  };

  const copyApprovalLink = async () => {
    if (!approvalUrl) return;
    try {
      await navigator.clipboard.writeText(approvalUrl);
      setNotice('Learner approval link copied.');
    } catch {
      setError('The approval link could not be copied. Select and copy it manually.');
    }
  };

  const handleSignOut = () => {
    void onSignOut().catch((signOutError) => {
      setError(signOutError instanceof Error ? signOutError.message : 'Sign out could not be completed.');
    });
  };

  const pending = outgoingLinks.filter((link) => link.status === 'PENDING');
  const active = outgoingLinks.filter((link) => link.status === 'APPROVED');
  const pendingForLearner = incomingLinks.filter((link) => link.status === 'PENDING');

  return (
    <main className="min-h-screen bg-[#f6f8fa] px-4 py-8 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-700">MicroDo</p>
            <h1 className="mt-1 text-2xl font-semibold">Parent / Guardian workspace</h1>
            <p className="mt-1 text-sm text-slate-500">Signed in as {currentUser.fullName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {onSwitchToLearner && (
              <button
                type="button"
                onClick={onSwitchToLearner}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
              >
                Learner workspace
              </button>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </header>

        {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {notice && <p role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

        <section className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-indigo-700" />
              <h2 className="text-base font-semibold">Request learner access</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter the learner’s account email. The request does not reveal whether an account exists. Access begins only after the account owner approves it.
            </p>
            {!emailVerified && (
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                Verify this guardian account before sending requests.
                <button type="button" onClick={() => void sendVerification()} className="ml-2 font-semibold underline">
                  Send verification email
                </button>
              </div>
            )}
            <form onSubmit={handleRequest} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="learner-email">Learner account email</label>
              <input
                id="learner-email"
                type="email"
                required
                maxLength={254}
                value={learnerEmail}
                onChange={(event) => setLearnerEmail(event.target.value)}
                placeholder="Learner account email"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="submit"
                disabled={isLoading || !emailVerified}
                className="rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send request
              </button>
            </form>
            {approvalUrl && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-700">Share this consent link with the learner</p>
                <input readOnly value={approvalUrl} className="mt-2 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-600" />
                <button type="button" onClick={() => void copyApprovalLink()} className="mt-2 text-xs font-semibold text-indigo-700 hover:underline">
                  Copy approval link
                </button>
              </div>
            )}
            <p className="mt-4 text-xs leading-5 text-slate-500">
              This implements learner-controlled consent, not legal guardian verification. Additional verification and consent requirements for minors must be handled by the operator before production use.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-base font-semibold">Linked learners</h2>
            <p className="mt-2 text-sm text-slate-600">
              {active.length
                ? `${active.length} approved relationship${active.length === 1 ? '' : 's'}.`
                : 'No learners have approved access yet.'}
            </p>
            <div className="mt-4 space-y-3">
              {active.map((link) => (
                <article key={link.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium">{link.learnerDisplayName || 'Learner'}</h3>
                      <p className="mt-1 text-xs text-slate-500">Access approved by the learner</p>
                    </div>
                    <button type="button" onClick={() => void handleRelationshipUpdate(link, 'REVOKED')} className="text-xs font-medium text-red-700 hover:underline">
                      Revoke access
                    </button>
                  </div>
                  <p className="mt-3 rounded-md bg-slate-50 p-2 text-xs leading-5 text-slate-600">
                    Learning progress is unavailable here because course, quiz and revision records are currently stored on the learner’s device, not in the shared database.
                  </p>
                </article>
              ))}
              {!active.length && !isLoading && (
                <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                  Once a learner approves a request, their consent record will appear here.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-base font-semibold">Pending requests</h2>
          {pending.length || pendingForLearner.length ? (
            <div className="mt-3 divide-y divide-slate-100">
              {pending.map((link) => {
                const url = new URL(window.location.href);
                url.search = '';
                url.searchParams.set('guardian-consent', link.id);
                return (
                  <div key={link.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <span>Request pending for {link.learnerEmail}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(url.toString());
                          setApprovalUrl(url.toString());
                          setNotice('Consent link copied.');
                        } catch {
                          setError('The consent link could not be copied.');
                        }
                      }}
                      className="text-xs font-medium text-indigo-700 hover:underline"
                    >
                      Copy consent link
                    </button>
                  </div>
                );
              })}
              {pendingForLearner.map((link) => (
                <div key={link.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <span>A guardian has requested access to your learning summary.</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => void handleRelationshipUpdate(link, 'APPROVED')} className="rounded-md bg-indigo-700 px-3 py-1.5 text-xs text-white hover:bg-indigo-600">
                      Approve
                    </button>
                    <button type="button" onClick={() => void handleRelationshipUpdate(link, 'REJECTED')} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              {canReviewLearnerRequests && !emailVerified
                ? 'Verify your email address to review guardian requests for this learner account.'
                : 'No pending requests.'}
            </p>
          )}
        </section>

        <footer className="mt-6 text-xs leading-5 text-slate-500">
          Guardian access is read-only and limited to the approved relationship record. This build does not expose source documents, credentials, or progress data.
        </footer>
      </div>
    </main>
  );
};
