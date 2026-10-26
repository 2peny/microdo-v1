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
  setDoc,
  serverTimestamp,
  runTransaction,
  DocumentData,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { PlatformRole, ScholarUser, ScholarArchetype, ScholarUserRole } from '../types';
import { ARCHETYPES } from '../utils/authStorage';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth & Firestore with dedicated Database ID
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

export const googleAuthProvider = new GoogleAuthProvider();

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
  throw new Error('The account data could not be loaded or saved. Please retry.');
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
    if (!snap.exists()) throw new Error('Authenticated account profile is not provisioned.');
    const data = snap.data();
    if (data.status && data.status !== 'active') {
      throw new Error('This account is not active.');
    }
    const role = (data.role || 'scholar') as ScholarUserRole;
    const roles: PlatformRole[] = Array.isArray(data.roles)
      ? data.roles.filter((value): value is PlatformRole =>
          value === 'SUPER_ADMIN' || value === 'LEARNER' || value === 'PARENT_GUARDIAN'
        )
      : role === 'admin' || role === 'super_admin'
      ? ['SUPER_ADMIN']
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
    handleFirestoreError(err, OperationType.GET, null);
  }
}

// Register real user via Firebase Auth and persist profile to Firestore
export async function registerWithFirebase(params: {
  email: string;
  password: string;
  fullName: string;
  username: string;
  archetype: ScholarArchetype;
  majorOrFocus: string;
  role?: 'scholar' | 'guardian';
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
  if (params.role && params.role !== 'scholar' && params.role !== 'guardian') {
    throw new Error('Only learner or guardian registration is available.');
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

  const archetypeDetail = ARCHETYPES[params.archetype] || ARCHETYPES.midnight_owl;
  const createdAt = new Date().toISOString();
  const role = params.role || 'scholar';
  const roles: PlatformRole[] = role === 'guardian' ? ['PARENT_GUARDIAN'] : ['LEARNER'];

  // 3. Persist verified profile to Firestore /users/{uid}
  const userDocRef = doc(db, 'users', user.uid);
  try {
    await setDoc(userDocRef, {
      id: user.uid,
      email,
      fullName,
      username,
      role,
      roles,
      archetype: params.archetype,
      archetypeLabel: archetypeDetail.label,
      avatarEmoji: archetypeDetail.emoji,
      majorOrFocus: params.majorOrFocus.trim() || 'General Studies',
      createdAt,
    });
  } catch (err) {
    try {
      await deleteUser(user);
    } catch {
      console.error('Failed to clean up a newly created account after profile provisioning failed.');
    }
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }

  return {
    id: user.uid,
    email,
    fullName,
    username,
    role,
    roles,
    archetype: params.archetype,
    archetypeLabel: archetypeDetail.label,
    avatarEmoji: archetypeDetail.emoji,
    majorOrFocus: params.majorOrFocus.trim() || 'General Studies',
    joinedAt: createdAt.split('T')[0],
  };
}

// Log in real user via Firebase Auth and load verified profile
export async function loginWithFirebase(identifier: string, password: string): Promise<ScholarUser> {
  const email = identifier.trim().toLowerCase();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return await fetchScholarUserProfile(credential.user);
}

// Sign in with Google Popup
export async function signInWithGooglePopup(role: 'scholar' | 'guardian' = 'scholar'): Promise<ScholarUser> {
  const result = await signInWithPopup(auth, googleAuthProvider);
  const user = result.user;

  // Ensure user document exists in Firestore
  const userDocRef = doc(db, 'users', user.uid);
  const existingSnap = await getDoc(userDocRef);
  if (!existingSnap.exists()) {
    const defaultArchetype = 'midnight_owl';
    const roles: PlatformRole[] = role === 'guardian' ? ['PARENT_GUARDIAN'] : ['LEARNER'];
    await setDoc(userDocRef, {
      id: user.uid,
      email: user.email || '',
      fullName: user.displayName || user.email?.split('@')[0] || (role === 'guardian' ? 'Guardian' : 'Learner'),
      username: (user.email?.split('@')[0] || (role === 'guardian' ? 'guardian' : 'learner')).replace(/[^a-zA-Z0-9_.-]/g, ''),
      role,
      roles,
      archetype: defaultArchetype,
      archetypeLabel: ARCHETYPES[defaultArchetype].label,
      avatarEmoji: ARCHETYPES[defaultArchetype].emoji,
      majorOrFocus: 'Computer Systems',
      createdAt: new Date().toISOString(),
    });
  }

  return await fetchScholarUserProfile(user);
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
        callback(scholar);
      } catch {
        callback(null);
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

      export async function getAdminUsers(): Promise<AdminUserRecord[]> {
        if (!auth.currentUser) throw new Error('Sign in with an administrator account.');
        const snapshots = await getDocs(collection(db, 'users'));
        return snapshots.docs.map((snapshot) => {
          const data = snapshot.data();
          const role = (data.role || 'scholar') as ScholarUserRole;
          const roles: PlatformRole[] = Array.isArray(data.roles)
            ? data.roles.filter((value): value is PlatformRole =>
                value === 'SUPER_ADMIN' || value === 'LEARNER' || value === 'PARENT_GUARDIAN'
              )
            : role === 'admin' || role === 'super_admin'
            ? ['SUPER_ADMIN']
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

      export async function updateAdminUser(userId: string, roles: PlatformRole[], status?: AdminUserRecord['status']): Promise<void> {
        const current = auth.currentUser;
        if (!current) throw new Error('Sign in with an administrator account.');
        if (!roles.length || roles.some((role) => !['SUPER_ADMIN', 'LEARNER', 'PARENT_GUARDIAN'].includes(role))) {
          throw new Error('Select at least one supported platform role.');
        }
        const uniqueRoles = [...new Set(roles)];
        const primaryRole: ScholarUserRole = uniqueRoles.includes('SUPER_ADMIN')
          ? 'super_admin'
          : uniqueRoles.includes('PARENT_GUARDIAN')
          ? 'guardian'
          : 'scholar';
        const userRef = doc(db, 'users', userId);
        const auditRef = doc(collection(db, 'adminAuditEvents'));
        const nextStatus = status || 'active';
        await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(userRef);
          if (!snapshot.exists()) throw new Error('The account no longer exists.');
          const previous = snapshot.data();
          const previousRoles: PlatformRole[] = Array.isArray(previous.roles)
            ? previous.roles
            : previous.role === 'admin' || previous.role === 'super_admin'
            ? ['SUPER_ADMIN']
            : previous.role === 'guardian'
            ? ['PARENT_GUARDIAN']
            : ['LEARNER'];
          const previousStatus = previous.status || 'active';
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
