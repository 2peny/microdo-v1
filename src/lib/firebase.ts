import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ScholarUser, ScholarArchetype } from '../types';
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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: user.uid,
        email: user.email || data.email,
        fullName: data.fullName || user.displayName || user.email?.split('@')[0] || 'Scholar',
        username: data.username || user.email?.split('@')[0] || 'scholar',
        role: data.role || 'scholar',
        archetype: (data.archetype as ScholarArchetype) || 'midnight_owl',
        archetypeLabel: data.archetypeLabel || ARCHETYPES.midnight_owl.label,
        avatarEmoji: data.avatarEmoji || ARCHETYPES.midnight_owl.emoji,
        majorOrFocus: data.majorOrFocus || 'Computer Systems',
        joinedAt: data.createdAt || new Date().toISOString().split('T')[0],
      };
    }
  } catch (err) {
    console.warn('Could not read existing Firestore profile, crafting from auth user:', err);
  }

  // Fallback if document does not exist yet
  const defaultArchetype = 'midnight_owl';
  return {
    id: user.uid,
    email: user.email || 'scholar@nodegrid.space',
    fullName: user.displayName || user.email?.split('@')[0] || 'Scholar',
    username: user.email?.split('@')[0] || 'scholar',
    role: 'scholar',
    archetype: defaultArchetype,
    archetypeLabel: ARCHETYPES[defaultArchetype].label,
    avatarEmoji: ARCHETYPES[defaultArchetype].emoji,
    majorOrFocus: 'Computer Systems',
    joinedAt: new Date().toISOString().split('T')[0],
  };
}

// Register real user via Firebase Auth and persist profile to Firestore
export async function registerWithFirebase(params: {
  email: string;
  password: string;
  fullName: string;
  username: string;
  archetype: ScholarArchetype;
  majorOrFocus: string;
}): Promise<ScholarUser> {
  // 1. Create authentication credentials in Firebase Auth
  const credential = await createUserWithEmailAndPassword(auth, params.email.trim(), params.password);
  const user = credential.user;

  // 2. Update display name
  try {
    await updateProfile(user, { displayName: params.fullName.trim() });
  } catch (e) {
    console.warn('Profile name update skipped:', e);
  }

  const archetypeDetail = ARCHETYPES[params.archetype] || ARCHETYPES.midnight_owl;
  const createdAt = new Date().toISOString();

  // 3. Persist verified profile to Firestore /users/{uid}
  const userDocRef = doc(db, 'users', user.uid);
  try {
    await setDoc(userDocRef, {
      id: user.uid,
      email: params.email.trim().toLowerCase(),
      fullName: params.fullName.trim(),
      username: params.username.trim().toLowerCase(),
      role: 'scholar',
      archetype: params.archetype,
      archetypeLabel: archetypeDetail.label,
      avatarEmoji: archetypeDetail.emoji,
      majorOrFocus: params.majorOrFocus.trim() || 'General Studies',
      createdAt,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }

  return {
    id: user.uid,
    email: params.email.trim().toLowerCase(),
    fullName: params.fullName.trim(),
    username: params.username.trim().toLowerCase(),
    role: 'scholar',
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
export async function signInWithGooglePopup(): Promise<ScholarUser> {
  const result = await signInWithPopup(auth, googleAuthProvider);
  const user = result.user;

  // Ensure user document exists in Firestore
  const userDocRef = doc(db, 'users', user.uid);
  try {
    const existingSnap = await getDoc(userDocRef);
    if (!existingSnap.exists()) {
      const defaultArchetype = 'midnight_owl';
      await setDoc(userDocRef, {
        id: user.uid,
        email: user.email || '',
        fullName: user.displayName || user.email?.split('@')[0] || 'Google Scholar',
        username: (user.email?.split('@')[0] || 'scholar').replace(/[^a-zA-Z0-9_.-]/g, ''),
        role: 'scholar',
        archetype: defaultArchetype,
        archetypeLabel: ARCHETYPES[defaultArchetype].label,
        avatarEmoji: ARCHETYPES[defaultArchetype].emoji,
        majorOrFocus: 'Computer Systems',
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Could not write Google user profile to Firestore:', err);
  }

  return await fetchScholarUserProfile(user);
}

// Sign out
export async function signOutScholar(): Promise<void> {
  await firebaseSignOut(auth);
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
