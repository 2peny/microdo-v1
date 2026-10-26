import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X, RefreshCw, Search, ShieldCheck, Users, Link2, AlertCircle } from 'lucide-react';
import { PlatformRole, ScholarUser } from '../types';
import {
  AdminUserRecord,
  AdminAuditEvent,
  GuardianLink,
  getAdminAuditEvents,
  getAdminGuardianLinks,
  getAdminUsers,
  updateAdminUser,
} from '../lib/firebase';

interface SuperuserDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ScholarUser | null;
}

const ROLE_OPTIONS: { role: PlatformRole; label: string }[] = [
  { role: 'LEARNER', label: 'Learner' },
  { role: 'PARENT_GUARDIAN', label: 'Parent / Guardian' },
  { role: 'SUPER_ADMIN', label: 'Super Admin' },
];

export const SuperuserDashboard: React.FC<SuperuserDashboardProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [links, setLinks] = useState<GuardianLink[]>([]);
  const [auditEvents, setAuditEvents] = useState<AdminAuditEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'relationships' | 'audit'>('overview');
  const [search, setSearch] = useState('');
  const [draftRoles, setDraftRoles] = useState<Record<string, PlatformRole[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedUsers, loadedLinks, loadedEvents] = await Promise.all([
        getAdminUsers(),
        getAdminGuardianLinks(),
        getAdminAuditEvents(),
      ]);
      setUsers(loadedUsers);
      setLinks(loadedLinks);
      setAuditEvents(loadedEvents);
      setDraftRoles(Object.fromEntries(
        loadedUsers.map((user) => [user.id, user.roles || ['LEARNER']])
      ));
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Administrator data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) void refresh();
  }, [isOpen, refresh]);

  const visibleUsers = useMemo(() => {
    const queryText = search.trim().toLowerCase();
    if (!queryText) return users;
    return users.filter((user) =>
      [user.fullName, user.email, user.username, user.id].some((field) =>
        field.toLowerCase().includes(queryText)
      )
    );
  }, [search, users]);

  if (!isOpen) return null;

  const roleCounts = users.reduce<Record<PlatformRole, number>>(
    (counts, user) => {
      for (const role of user.roles || ['LEARNER']) counts[role] += 1;
      return counts;
    },
    { SUPER_ADMIN: 0, LEARNER: 0, PARENT_GUARDIAN: 0 }
  );

  const setRole = (userId: string, role: PlatformRole, checked: boolean) => {
    setDraftRoles((current) => {
      const next = new Set(current[userId] || ['LEARNER']);
      if (checked) next.add(role);
      else next.delete(role);
      return { ...current, [userId]: [...next] };
    });
  };

  const saveUser = async (user: AdminUserRecord) => {
    const roles = draftRoles[user.id] || user.roles || ['LEARNER'];
    if (roles.length === 0) {
      setError('Assign at least one role before saving.');
      return;
    }
    if (user.id === currentUser?.id && !roles.includes('SUPER_ADMIN')) {
      setError('You cannot remove your own Super Admin role.');
      return;
    }
    if (
      user.roles?.includes('SUPER_ADMIN') &&
      !roles.includes('SUPER_ADMIN') &&
      roleCounts.SUPER_ADMIN < 2
    ) {
      setError('The last Super Admin cannot be removed.');
      return;
    }

    const status = user.status || 'active';
    if (!window.confirm(`Save roles for ${user.fullName}?`)) return;
    setLoading(true);
    setError(null);
    try {
      await updateAdminUser(user.id, roles, status);
      setNotice('Account roles saved.');
      await refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The account could not be updated.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (user: AdminUserRecord) => {
    if (user.id === currentUser?.id) {
      setError('You cannot suspend your own administrator account.');
      return;
    }
    const status = user.status === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`${status === 'suspended' ? 'Suspend' : 'Reactivate'} ${user.fullName}?`)) return;
    setLoading(true);
    setError(null);
    try {
      await updateAdminUser(user.id, user.roles || ['LEARNER'], status);
      setNotice(`Account ${status === 'active' ? 'reactivated' : 'suspended'}.`);
      await refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The account status could not be updated.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-backend-title"
        className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 shadow-2xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <h1 id="owner-backend-title" className="text-sm font-semibold">Owner Backend</h1>
              <span className="rounded-full border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-300">
                AUTHORIZED
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Firebase account: {currentUser?.email || 'Verified administrator'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-800 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Owner Backend"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <nav aria-label="Owner Backend sections" className="flex gap-2 border-b border-slate-800 px-5 py-3">
          {([
            ['overview', 'Overview'],
            ['users', 'Users'],
            ['relationships', 'Guardian relationships'],
            ['audit', 'Security audit'],
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-2 text-xs ${activeTab === tab ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900'}`}
            >
              {label}
            </button>
          ))}
        </nav>

        <main className="flex-1 overflow-y-auto p-5 sm:p-7">
          {error && (
            <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {notice && <p role="status" className="mb-4 text-sm text-emerald-300">{notice}</p>}
          {loading && <p className="mb-4 text-xs text-slate-400">Loading authorized records…</p>}

          {activeTab === 'overview' && (
            <div>
              <h2 className="text-lg font-semibold">Platform accounts</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                Counts below come from Firebase user profiles visible to this administrator. Learning activity and document-processing metrics are unavailable because those records are not stored in the shared backend.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="User profiles" value={users.length} icon={<Users className="h-4 w-4" />} />
                <Metric label="Learner role assignments" value={roleCounts.LEARNER} />
                <Metric label="Guardian role assignments" value={roleCounts.PARENT_GUARDIAN} />
                <Metric label="Super Admin assignments" value={roleCounts.SUPER_ADMIN} />
                <Metric label="Guardian relationships" value={links.length} icon={<Link2 className="h-4 w-4" />} />
              </div>
              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <h3 className="text-sm font-medium">Learning analytics</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Unavailable: learning progress, quiz attempts and revision history currently remain in individual browser storage. No production metrics are fabricated or inferred from sample data.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <h2 className="text-lg font-semibold">User management</h2>
                  <p className="mt-1 text-xs text-slate-400">Role and account-status changes are checked by Firestore rules.</p>
                </div>
                <label className="relative">
                  <span className="sr-only">Search users</span>
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search name, email, username or ID"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-xs sm:w-80"
                  />
                </label>
              </div>
              <div className="mt-5 space-y-3">
                {visibleUsers.map((user) => {
                  const roles = draftRoles[user.id] || user.roles || ['LEARNER'];
                  return (
                    <article key={user.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-medium">{user.fullName}</h3>
                          <p className="mt-1 truncate text-xs text-slate-400">{user.email}</p>
                          <p className="mt-1 break-all font-mono text-[10px] text-slate-500">{user.id}</p>
                          <p className={`mt-2 text-[11px] ${user.status === 'suspended' ? 'text-red-300' : 'text-emerald-300'}`}>
                            {user.status}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          {ROLE_OPTIONS.map(({ role, label }) => (
                            <label key={role} className="flex items-center gap-2 text-xs text-slate-300">
                              <input
                                type="checkbox"
                                checked={roles.includes(role)}
                                onChange={(event) => setRole(user.id, role, event.target.checked)}
                                disabled={user.id === currentUser?.id && role === 'SUPER_ADMIN'}
                                className="accent-indigo-500"
                              />
                              {label}
                            </label>
                          ))}
                          <button
                            type="button"
                            onClick={() => void saveUser(user)}
                            disabled={loading}
                            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium hover:bg-indigo-500 disabled:opacity-50"
                          >
                            Save roles
                          </button>
                          <button
                            type="button"
                            onClick={() => void toggleStatus(user)}
                            disabled={loading || user.id === currentUser?.id}
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-800 disabled:opacity-50"
                          >
                            {user.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
                {!visibleUsers.length && !loading && <p className="text-sm text-slate-400">No matching accounts.</p>}
              </div>
            </div>
          )}

          {activeTab === 'relationships' && (
            <div>
              <h2 className="text-lg font-semibold">Guardian relationships</h2>
              <p className="mt-1 text-xs text-slate-400">
                Requests require the learner to approve from a verified account. Administrators can inspect status but cannot grant learner access by editing this list.
              </p>
              <div className="mt-5 divide-y divide-slate-800 rounded-xl border border-slate-800">
                {links.map((link) => (
                  <div key={link.id} className="grid gap-2 p-4 text-xs sm:grid-cols-5">
                    <span className="text-slate-200">{link.learnerDisplayName || 'Learner has not approved yet'}</span>
                    <span className="break-all text-slate-400">{link.learnerEmail}</span>
                    <span className="font-mono text-slate-400">{link.status}</span>
                    <span className="break-all font-mono text-[10px] text-slate-500">Guardian {link.guardianId}</span>
                    <span className="text-slate-500">
                      {(link.history || []).map((event) => event.action).join(' / ') || 'No history'}
                      {link.updatedAt ? ` · ${new Date(link.updatedAt).toLocaleDateString()}` : ''}
                    </span>
                  </div>
                ))}
                {!links.length && !loading && (
                  <p className="p-4 text-sm text-slate-400">No guardian relationship requests are recorded.</p>
                )}
              </div>
              <p className="mt-4 text-xs text-slate-500">
                The application has no separate legal-guardian verification provider. Learner approval is not a substitute for required minor-guardian verification or consent.
              </p>
            </div>
          )}

          {activeTab === 'audit' && (
            <div>
              <h2 className="text-lg font-semibold">Security audit</h2>
              <p className="mt-1 text-xs text-slate-400">
                Recent account access changes. Events contain account IDs and role/status changes only, never credentials or learner content.
              </p>
              <div className="mt-5 divide-y divide-slate-800 rounded-xl border border-slate-800">
                {auditEvents.map((event) => (
                  <div key={event.id} className="grid gap-2 p-4 text-xs sm:grid-cols-5">
                    <span className="text-slate-200">{event.action}</span>
                    <span className="break-all text-slate-400">Actor {event.actorId}</span>
                    <span className="break-all text-slate-400">Target {event.targetId}</span>
                    <span className="text-slate-400">
                      {event.roles.map(roleName).join(', ')} · {event.status}
                    </span>
                    <time className="text-slate-500">
                      {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Time unavailable'}
                    </time>
                  </div>
                ))}
                {!auditEvents.length && !loading && (
                  <p className="p-4 text-sm text-slate-400">No persisted access changes are recorded.</p>
                )}
              </div>
            </div>
          )}
        </main>
      </section>
    </div>
  );
};

const roleName = (role: PlatformRole) =>
  ROLE_OPTIONS.find((option) => option.role === role)?.label || role;

const Metric: React.FC<{ label: string; value: number; icon?: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
    <div className="flex items-center gap-2 text-xs text-slate-400">
      {icon}
      <span>{label}</span>
    </div>
    <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
  </div>
);
