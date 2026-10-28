import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  deleteUser,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  runTransaction,
  DocumentData,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { PlatformRole, RegistrationRole, ScholarUser, ScholarArchetype, ScholarUserRole } from '../types';
import { ARCHETYPES } from '../utils/authStorage';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth & Firestore with dedicated Database ID
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

export const googleAuthProvider = new GoogleAuthProvider();
export const INITIAL_SUPER_ADMIN_EMAIL = 'elixirdaoist@gmail.com';

export function isInitialSuperAdmin(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === INITIAL_SUPER_ADMIN_EMAIL;
}

export function isCurrentInitialSuperAdmin(): boolean {
  return auth.currentUser?.emailVerified === true &&
    isInitialSuperAdmin(auth.currentUser.email);
}

/**
 * Refreshes Firebase Auth's profile and ID token before a privileged Firestore request.
 * This is required when an owner verifies their email in another tab: Firestore evaluates
 * the email_verified claim embedded in the ID token, not a stale client-side profile.
 */
export async function refreshAuthenticatedSession(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in with an administrator account.');
  await user.reload();
  await user.getIdToken(true);
}

// Error Handling Infrastructure mandated for Firestore operations
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const code = typeof error === 'object' && error && 'code' in error
    ? String(error.code)
    : 'unknown';
  console.error('Firestore operation failed', { operationType, code });
  const message = code === 'permission-denied'
    ? 'Firestore denied access to the account data. Check the deployed Firestore rules and retry.'
    : code === 'unavailable' || code === 'deadline-exceeded'
    ? 'Firestore is temporarily unavailable. Check your connection and retry.'
    : `The account data could not be loaded or saved (${code}). Please retry.`;
  throw Object.assign(new Error(message), { code });
}

// Check that Firestore is initialized and ready
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    return Boolean(db && db.app);
  } catch (error) {
    console.warn('Notice: Firestore connection check:', error);
    return false;
  }
}

// Helper: Convert Firebase Auth User + Firestore Doc into ScholarUser
export async function fetchScholarUserProfile(user: FirebaseUser): Promise<ScholarUser> {
  const userDocRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      throw Object.assign(new Error('Authenticated account profile is not provisioned.'), {
        code: 'profile-not-found',
      });
    }
    const data = snap.data();
    if (data.status && data.status !== 'active') {
      throw new Error('This account is not active.');
    }
    const storedRole = (data.role || 'scholar') as ScholarUserRole;
    const role: ScholarUserRole = user.emailVerified && isInitialSuperAdmin(user.email)
      ? 'admin'
      : storedRole;
    const roles: PlatformRole[] = Array.isArray(data.roles)
      ? data.roles.filter((value): value is PlatformRole =>
          value === 'LEARNER' || value === 'PARENT_GUARDIAN'
        )
      : role === 'admin'
      ? ['LEARNER']
      : role === 'guardian'
      ? ['PARENT_GUARDIAN']
      : ['LEARNER'];
    return {
      id: user.uid,
      email: user.email || data.email,
      fullName: data.fullName || user.displayName || user.email?.split('@')[0] || 'Learner',
      username: data.username || user.email?.split('@')[0] || 'learner',
      role,
      roles,
      archetype: (data.archetype as ScholarArchetype) || 'midnight_owl',
      archetypeLabel: data.archetypeLabel || ARCHETYPES.midnight_owl.label,
      avatarEmoji: data.avatarEmoji || ARCHETYPES.midnight_owl.emoji,
      majorOrFocus: data.majorOrFocus || 'Computer Systems',
      joinedAt: data.createdAt || new Date().toISOString().split('T')[0],
      status: data.status || 'active',
    };
  } catch (err) {
    if (typeof err === 'object' && err && 'code' in err && err.code === 'profile-not-found') {
      throw err;
    }
    handleFirestoreError(err, OperationType.GET, null);
  }
}

async function createUserProfile(
  user: FirebaseUser,
  params: {
    fullName: string;
    username: string;
    archetype: ScholarArchetype;
    majorOrFocus: string;
    role: RegistrationRole;
  }
): Promise<ScholarUser> {
  const userDocRef = doc(db, 'users', user.uid);
  const existingSnap = await getDoc(userDocRef);
  if (existingSnap.exists()) return fetchScholarUserProfile(user);

  const email = user.email?.trim().toLowerCase();
  if (!email) throw new Error('The Google account must have an email address to create a MicroDo profile.');
  if (email.length > 150) throw new Error('The Google account email is too long for a MicroDo profile.');
  const fullName = params.fullName.trim().slice(0, 100);
  const username = params.username.trim().toLowerCase();
  if (!fullName || !/^[a-zA-Z0-9_.-]{1,50}$/.test(username)) {
    throw new Error('The account profile needs a valid name and username.');
  }

  const isBootstrapAdmin = user.emailVerified && isInitialSuperAdmin(email);
  const role: ScholarUserRole = isBootstrapAdmin
    ? 'admin'
    : params.role === 'guardian'
    ? 'guardian'
    : 'scholar';
  const roles: PlatformRole[] = role === 'guardian' ? ['PARENT_GUARDIAN'] : ['LEARNER'];
  const archetypeDetail = ARCHETYPES[params.archetype] || ARCHETYPES.midnight_owl;
  const createdAt = new Date().toISOString();
  const userProfile = {
    id: user.uid,
    email,
    fullName,
    username,
    role,
    roles,
    archetype: params.archetype,
    archetypeLabel: archetypeDetail.label,
    avatarEmoji: archetypeDetail.emoji,
    majorOrFocus: params.majorOrFocus.trim() || (role === 'guardian' ? 'Parent / Guardian' : 'General Studies'),
    createdAt,
  };

  const batch = writeBatch(db);
  batch.set(userDocRef, userProfile);
  if (
    params.role === 'admin_request' &&
    !isBootstrapAdmin &&
    !isInitialSuperAdmin(email)
  ) {
    batch.set(doc(db, 'adminAccessRequests', user.uid), {
      userId: user.uid,
      email,
      fullName: userProfile.fullName,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }

  return fetchScholarUserProfile(user);
}

// Register real user via Firebase Auth and persist profile to Firestore
export async function registerWithFirebase(params: {
  email: string;
  password: string;
  fullName: string;
  username: string;
  archetype: ScholarArchetype;
  majorOrFocus: string;
  role?: RegistrationRole;
}): Promise<ScholarUser> {
  const email = params.email.trim().toLowerCase();
  const fullName = params.fullName.trim();
  const username = params.username.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
    throw new Error('Enter a valid email address.');
  }
  if (!fullName || fullName.length > 100) {
    throw new Error('Full name must contain 1 to 100 characters.');
  }
  if (!/^[a-zA-Z0-9_.-]{1,50}$/.test(username)) {
    throw new Error('Username must be 1 to 50 letters, numbers, dots, underscores or hyphens.');
  }
  if (params.role && !['scholar', 'guardian', 'admin_request'].includes(params.role)) {
    throw new Error('Choose a supported account type.');
  }

  // 1. Create authentication credentials in Firebase Auth
  const credential = await createUserWithEmailAndPassword(auth, email, params.password);
  const user = credential.user;

  // 2. Update display name
  try {
    await updateProfile(user, { displayName: params.fullName.trim() });
  } catch (e) {
    console.warn('Profile name update skipped:', e);
  }

  try {
    return await createUserProfile(user, {
      fullName,
      username,
      archetype: params.archetype,
      majorOrFocus: params.majorOrFocus,
      role: params.role || 'scholar',
    });
  } catch (err) {
    try {
      await deleteUser(user);
    } catch {
      console.error('Failed to clean up a newly created account after profile provisioning failed.');
    }
    throw err;
  }
}

// Log in real user via Firebase Auth and load verified profile
export async function loginWithFirebase(identifier: string, password: string): Promise<ScholarUser> {
  const email = identifier.trim().toLowerCase();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  try {
    return await fetchScholarUserProfile(credential.user);
  } catch (error) {
    const isMissingProfile = typeof error === 'object' && error && 'code' in error &&
      error.code === 'profile-not-found';
    if (!isMissingProfile) throw error;

    const emailName = credential.user.email?.split('@')[0] || 'learner';
    const username = emailName.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 50) ||
      `user-${credential.user.uid.slice(0, 8)}`;
    return createUserProfile(credential.user, {
      fullName: credential.user.displayName?.trim() || emailName,
      username,
      archetype: 'midnight_owl',
      majorOrFocus: 'General Studies',
      role: 'scholar',
    });
  }
}

// Sign in with Google Popup
export type GoogleSignInResult =
  | { kind: 'existing'; user: ScholarUser }
  | { kind: 'new'; firebaseUser: FirebaseUser };

export async function signInWithGooglePopup(): Promise<GoogleSignInResult> {
  const result = await signInWithPopup(auth, googleAuthProvider);
  const user = result.user;

  const userDocRef = doc(db, 'users', user.uid);
  const existingSnap = await getDoc(userDocRef);
  return existingSnap.exists()
    ? { kind: 'existing', user: await fetchScholarUserProfile(user) }
    : { kind: 'new', firebaseUser: user };
}

export async function completeGoogleProfileSetup(
  user: FirebaseUser,
  role: RegistrationRole,
  majorOrFocus: string
): Promise<ScholarUser> {
  const emailName = user.email?.split('@')[0] || '';
  const username = emailName.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 50) ||
    `user-${user.uid.slice(0, 8)}`;
  return createUserProfile(user, {
    fullName: user.displayName?.trim() || emailName || 'Learner',
    username,
    archetype: 'midnight_owl',
    majorOrFocus,
    role,
  });
}

// Sign out
export async function signOutScholar(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function sendAccountVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in before requesting an email verification link.');
  if (user.emailVerified) return;
  await sendEmailVerification(user);
}

export function isCurrentEmailVerified(): boolean {
  return auth.currentUser?.emailVerified === true;
}

export async function refreshCurrentEmailVerification(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  await user.reload();
  await user.getIdToken(true);
  return user.emailVerified;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Enter the account email address to request a password reset.');
  }
  try {
    await sendPasswordResetEmail(auth, normalizedEmail);
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : '';
    if (code !== 'auth/user-not-found') {
      throw new Error('The password reset request could not be completed. Please retry later.');
    }
  }
}

// Subscribe to real auth state
export function onScholarAuthStateChanged(callback: (user: ScholarUser | null) => void): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const scholar = await fetchScholarUserProfile(firebaseUser);
        if (auth.currentUser?.uid === firebaseUser.uid) callback(scholar);
      } catch (error) {
        const isAwaitingGoogleProfile =
          typeof error === 'object' && error && 'code' in error &&
          error.code === 'profile-not-found';
        if (!isAwaitingGoogleProfile && auth.currentUser?.uid === firebaseUser.uid) {
          console.error('Authenticated account profile could not be loaded.', error);
        }
        if (auth.currentUser?.uid === firebaseUser.uid) callback(null);
      }
    } else {
      callback(null);
    }
  });
}

export interface GuardianLink {
        id: string;
        guardianId: string;
        learnerEmail: string;
        learnerId?: string;
        status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
        createdAt?: string;
        updatedAt?: string;
        learnerDisplayName?: string;
        history: { actorId: string; action: string }[];
      }

      function toGuardianLink(id: string, data: DocumentData): GuardianLink {
        return {
          id,
          guardianId: data.guardianId,
          learnerEmail: data.learnerEmail,
          learnerId: data.learnerId,
          status: data.status,
          createdAt: data.createdAt?.toDate?.().toISOString(),
          updatedAt: data.updatedAt?.toDate?.().toISOString(),
          learnerDisplayName: data.learnerDisplayName,
          history: Array.isArray(data.history) ? data.history : [],
        };
      }

      export async function getGuardianLinks(
        field: 'guardianId' | 'learnerEmail'
      ): Promise<GuardianLink[]> {
        const user = auth.currentUser;
        if (!user) throw new Error('Sign in to view relationship requests.');
        if (field === 'learnerEmail' && !user.emailVerified) {
          throw new Error('Verify your email address before reviewing guardian requests.');
        }
        const value = field === 'guardianId' ? user.uid : user.email;
        if (!value) throw new Error('The signed-in account has no verified email address.');
        const result = await getDocs(query(collection(db, 'guardianLinks'), where(field, '==', value)));
        return result.docs.map((snapshot) => toGuardianLink(snapshot.id, snapshot.data()));
      }

      export async function getGuardianLink(linkId: string): Promise<GuardianLink> {
        const snapshot = await getDoc(doc(db, 'guardianLinks', linkId));
        if (!snapshot.exists()) throw new Error('This relationship request was not found.');
        return toGuardianLink(snapshot.id, snapshot.data());
      }

      export async function requestGuardianLink(learnerEmail: string): Promise<void> {
        const guardian = auth.currentUser;
        if (!guardian) throw new Error('Sign in as a guardian to request a learner link.');
        if (!guardian.emailVerified) throw new Error('Verify your email address before requesting learner access.');
        const normalizedEmail = learnerEmail.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
          throw new Error('Enter a valid learner email address.');
        }
        const linkRef = doc(db, 'guardianLinks', `${guardian.uid}_${normalizedEmail}`);
        await runTransaction(db, async (transaction) => {
          const existing = await transaction.get(linkRef);
          if (!existing.exists()) {
            transaction.set(linkRef, {
              guardianId: guardian.uid,
              learnerEmail: normalizedEmail,
              status: 'PENDING',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              history: [{ actorId: guardian.uid, action: 'REQUESTED' }],
            });
            return;
          }
          const data = existing.data();
          if (!['REJECTED', 'REVOKED'].includes(data.status)) {
            throw new Error('A relationship request already exists or is already active.');
          }
          transaction.update(linkRef, {
            status: 'PENDING',
            updatedAt: serverTimestamp(),
            history: [...(Array.isArray(data.history) ? data.history : []), {
              actorId: guardian.uid,
              action: 'REQUESTED',
            }],
          });
        });
      }

      export async function updateGuardianLink(
        link: GuardianLink,
        status: GuardianLink['status'],
        learnerDisplayName?: string
      ): Promise<void> {
        const current = auth.currentUser;
        const isLearner = Boolean(current?.emailVerified && current.email === link.learnerEmail);
        if (!current || (current.uid !== link.guardianId && !isLearner)) {
          throw new Error('You are not authorised to update this relationship.');
        }
        const linkRef = doc(db, 'guardianLinks', link.id);
        await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(linkRef);
          if (!snapshot.exists()) throw new Error('This relationship request no longer exists.');
          const data = snapshot.data();
          const history = Array.isArray(data.history) ? data.history : [];
          transaction.update(linkRef, {
            status,
            updatedAt: serverTimestamp(),
            history: [...history, {
              actorId: current.uid,
              action: status === 'PENDING' ? 'REQUESTED' : status,
            }],
            ...(status === 'APPROVED' && learnerDisplayName
              ? {
                  learnerDisplayName: learnerDisplayName.trim().slice(0, 100),
                  learnerId: current.uid,
                }
              : {}),
          });
        });
      }

      export interface AdminUserRecord extends ScholarUser {
        status: 'active' | 'suspended' | 'pending';
      }

      export interface AdminAuditEvent {
        id: string;
        actorId: string;
        targetId: string;
        action: string;
        roles: PlatformRole[];
        status: 'active' | 'suspended' | 'pending';
        timestamp?: string;
      }

      export interface AdminAccessRequest {
        userId: string;
        email: string;
        fullName: string;
        createdAt?: string;
      }

      export async function getAdminUsers(): Promise<AdminUserRecord[]> {
        if (!auth.currentUser) throw new Error('Sign in with an administrator account.');
        const snapshots = await getDocs(collection(db, 'users'));
        return snapshots.docs.map((snapshot) => {
          const data = snapshot.data();
          const storedRole = (data.role || 'scholar') as ScholarUserRole;
          const role: ScholarUserRole = auth.currentUser?.emailVerified && isInitialSuperAdmin(data.email)
            ? 'admin'
            : storedRole;
          const roles: PlatformRole[] = Array.isArray(data.roles)
            ? data.roles.filter((value): value is PlatformRole =>
                value === 'LEARNER' || value === 'PARENT_GUARDIAN'
              )
            : role === 'admin'
            ? ['LEARNER']
            : role === 'guardian'
            ? ['PARENT_GUARDIAN']
            : ['LEARNER'];
          const archetype = (data.archetype as ScholarArchetype) || 'midnight_owl';
          return {
            id: snapshot.id,
            email: data.email || '',
            fullName: data.fullName || 'Account',
            username: data.username || '',
            role,
            roles,
            archetype,
            archetypeLabel: data.archetypeLabel || ARCHETYPES[archetype].label,
            avatarEmoji: data.avatarEmoji || ARCHETYPES[archetype].emoji,
            majorOrFocus: data.majorOrFocus || '',
            joinedAt: data.createdAt || '',
            status: data.status || 'active',
          };
        });
      }

      export async function getAdminGuardianLinks(): Promise<GuardianLink[]> {
        if (!auth.currentUser) throw new Error('Sign in with an administrator account.');
        const snapshots = await getDocs(collection(db, 'guardianLinks'));
        return snapshots.docs.map((snapshot) => toGuardianLink(snapshot.id, snapshot.data()));
      }

      export async function getAdminAuditEvents(): Promise<AdminAuditEvent[]> {
        if (!auth.currentUser) throw new Error('Sign in with an administrator account.');
        const snapshots = await getDocs(query(
          collection(db, 'adminAuditEvents'),
          orderBy('timestamp', 'desc'),
          limit(100)
        ));
        return snapshots.docs.map((snapshot) => {
          const data = snapshot.data();
          return {
            id: snapshot.id,
            actorId: data.actorId,
            targetId: data.targetId,
            action: data.action,
            roles: data.roles,
            status: data.status,
            timestamp: data.timestamp?.toDate?.().toISOString(),
          };
        });
      }

      export async function getAdminAccessRequests(): Promise<AdminAccessRequest[]> {
        if (!isCurrentInitialSuperAdmin()) {
          throw new Error('Only the configured Super Admin can review admin access requests.');
        }
        const snapshots = await getDocs(query(
          collection(db, 'adminAccessRequests'),
          orderBy('createdAt', 'desc')
        ));
        return snapshots.docs
          .filter((snapshot) => snapshot.data().status === 'pending')
          .map((snapshot) => {
            const data = snapshot.data();
            return {
              userId: data.userId,
              email: data.email,
              fullName: data.fullName,
              createdAt: data.createdAt?.toDate?.().toISOString(),
            };
          });
      }

      export async function reviewAdminAccessRequest(
        userId: string,
        decision: 'approved' | 'rejected'
      ): Promise<void> {
        const current = auth.currentUser;
        if (!current || !isCurrentInitialSuperAdmin()) {
          throw new Error('Only the configured Super Admin can review admin access requests.');
        }

        const requestRef = doc(db, 'adminAccessRequests', userId);
        const userRef = doc(db, 'users', userId);
        const auditRef = doc(collection(db, 'adminAuditEvents'));
        await runTransaction(db, async (transaction) => {
          const [requestSnapshot, userSnapshot] = await Promise.all([
            transaction.get(requestRef),
            transaction.get(userRef),
          ]);
          if (!requestSnapshot.exists() || requestSnapshot.data().status !== 'pending') {
            throw new Error('This admin access request is no longer pending.');
          }
          if (!userSnapshot.exists()) {
            throw new Error('The requesting account no longer exists.');
          }

          const userData = userSnapshot.data();
          const roles: PlatformRole[] = Array.isArray(userData.roles)
            ? userData.roles.filter((role): role is PlatformRole =>
                role === 'LEARNER' || role === 'PARENT_GUARDIAN'
              )
            : ['LEARNER'];
          if (decision === 'approved') {
            transaction.update(userRef, {
              role: 'admin',
              roles,
              status: 'active',
              lastAdminEventId: auditRef.id,
            });
          }
          transaction.update(requestRef, {
            status: decision,
            reviewedAt: serverTimestamp(),
            reviewedBy: current.uid,
            reviewEventId: auditRef.id,
          });
          transaction.set(auditRef, {
            actorId: current.uid,
            targetId: userId,
            action: decision === 'approved'
              ? 'ADMIN_ACCESS_REQUEST_APPROVED'
              : 'ADMIN_ACCESS_REQUEST_REJECTED',
            roles,
            status: 'active',
            timestamp: serverTimestamp(),
          });
        });
      }

      export async function updateAdminUser(userId: string, roles: PlatformRole[], status?: AdminUserRecord['status']): Promise<void> {
        const current = auth.currentUser;
        if (!current) throw new Error('Sign in with an administrator account.');
        if (!roles.length || roles.some((role) => !['LEARNER', 'PARENT_GUARDIAN'].includes(role))) {
          throw new Error('Select at least one supported platform role.');
        }
        const uniqueRoles = [...new Set(roles)];
        const userRef = doc(db, 'users', userId);
        const auditRef = doc(collection(db, 'adminAuditEvents'));
        const nextStatus = status || 'active';
        await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(userRef);
          if (!snapshot.exists()) throw new Error('The account no longer exists.');
          const previous = snapshot.data();
          const previousRole = previous.role || 'scholar';
          const previousRoles: PlatformRole[] = Array.isArray(previous.roles)
            ? previous.roles.filter((value): value is PlatformRole => value === 'LEARNER' || value === 'PARENT_GUARDIAN')
            : previousRole === 'guardian'
            ? ['PARENT_GUARDIAN']
            : ['LEARNER'];
          const previousStatus = previous.status || 'active';
          const primaryRole: ScholarUserRole = previousRole === 'admin'
            ? 'admin'
            : uniqueRoles.includes('PARENT_GUARDIAN')
            ? 'guardian'
            : 'scholar';
          const sameRoles = previousRoles.length === uniqueRoles.length &&
            previousRoles.every((role, index) => role === uniqueRoles[index]);
          if (sameRoles && previousStatus === nextStatus && previous.role === primaryRole) return;

          transaction.update(userRef, {
            role: primaryRole,
            roles: uniqueRoles,
            status: nextStatus,
            lastAdminEventId: auditRef.id,
          });
          transaction.set(auditRef, {
            actorId: current.uid,
            targetId: userId,
            action: 'USER_ACCESS_UPDATED',
            roles: uniqueRoles,
            status: nextStatus,
            timestamp: serverTimestamp(),
          });
        });
      }
