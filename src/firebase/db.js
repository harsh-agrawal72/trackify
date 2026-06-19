import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

// ──────────────────────────────────────────────────────────
// Helper: get a subcollection ref for a user
// ──────────────────────────────────────────────────────────
const userCol = (uid, colName) => collection(db, 'users', uid, colName);

// ──────────────────────────────────────────────────────────
// Load all data for a user from Firestore
// ──────────────────────────────────────────────────────────
export const loadUserData = async (uid) => {
  const cols = ['habits', 'tasks', 'logs', 'categories', 'focusSessions'];
  const result = {};

  await Promise.all(
    cols.map(async (colName) => {
      const snap = await getDocs(userCol(uid, colName));
      result[colName] = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
    })
  );

  // Load stats document
  try {
    const statsSnap = await getDocs(collection(db, 'users', uid, 'stats'));
    result.stats = statsSnap.empty ? null : statsSnap.docs[0].data();
  } catch {
    result.stats = null;
  }

  return result;
};

// ──────────────────────────────────────────────────────────
// Save a single item to a subcollection
// ──────────────────────────────────────────────────────────
export const saveItem = async (uid, colName, item) => {
  const ref = doc(db, 'users', uid, colName, item.id);
  await setDoc(ref, { ...item, _updatedAt: serverTimestamp() }, { merge: true });
};

// ──────────────────────────────────────────────────────────
// Delete a single item from a subcollection
// ──────────────────────────────────────────────────────────
export const deleteItem = async (uid, colName, itemId) => {
  const ref = doc(db, 'users', uid, colName, itemId);
  await deleteDoc(ref);
};

// ──────────────────────────────────────────────────────────
// Save user stats (single document)
// ──────────────────────────────────────────────────────────
export const saveStats = async (uid, stats) => {
  const ref = doc(db, 'users', uid, 'stats', 'main');
  await setDoc(ref, { ...stats, _updatedAt: serverTimestamp() }, { merge: true });
};

// ──────────────────────────────────────────────────────────
// Batch write an entire array to a collection (used for migration)
// ──────────────────────────────────────────────────────────
const batchWriteCollection = async (uid, colName, items) => {
  if (!items || items.length === 0) return;
  const batch = writeBatch(db);
  items.forEach((item) => {
    const ref = doc(db, 'users', uid, colName, item.id);
    batch.set(ref, { ...item, _updatedAt: serverTimestamp() }, { merge: true });
  });
  await batch.commit();
};

// ──────────────────────────────────────────────────────────
// Migrate localStorage data to Firestore (runs once on first login)
// ──────────────────────────────────────────────────────────
export const migrateFromLocalStorage = async (uid) => {
  const prefixes = ['habbitz_', 'habitzz_', 'trackify_', 'momentum_'];
  const getLS = (key) => {
    for (const p of prefixes) {
      try {
        const val = localStorage.getItem(`${p}${key}`);
        if (val) return JSON.parse(val);
      } catch { }
    }
    return null;
  };

  const habits = getLS('habits') || [];
  const tasks = getLS('tasks') || [];
  const logs = getLS('logs') || [];
  const categories = getLS('categories') || [];
  const focusSessions = getLS('focus_sessions') || [];
  const stats = getLS('stats');

  await Promise.all([
    batchWriteCollection(uid, 'habits', habits),
    batchWriteCollection(uid, 'tasks', tasks),
    batchWriteCollection(uid, 'logs', logs),
    batchWriteCollection(uid, 'categories', categories),
    batchWriteCollection(uid, 'focusSessions', focusSessions),
    stats ? saveStats(uid, stats) : Promise.resolve(),
  ]);

  // Mark migration done
  localStorage.setItem('habbitz_migrated', uid);
  console.log('[Firebase] localStorage migration complete ✅');
};

export { db };
