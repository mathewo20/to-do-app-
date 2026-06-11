import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { Category, Task, UrgencyLevel } from './types';

const defaultCategories: Omit<Category, 'id'>[] = [
  {
    name: 'Non-urgent',
    urgencyLevel: 'non-urgent',
    defaultTemplate: { alarmOffsets: [], notificationOffsets: [0] },
  },
  {
    name: 'Little urgent',
    urgencyLevel: 'little-urgent',
    defaultTemplate: { alarmOffsets: [], notificationOffsets: [15, 0] },
  },
  {
    name: 'Urgent',
    urgencyLevel: 'urgent',
    defaultTemplate: { alarmOffsets: [30], notificationOffsets: [5] },
  },
  {
    name: 'Extremely urgent',
    urgencyLevel: 'extremely-urgent',
    defaultTemplate: { alarmOffsets: [30, 15], notificationOffsets: [20, 15, 10, 5] },
  },
];

export async function createUserProfile(uid: string, displayName: string, timezone: string) {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    createdAt: serverTimestamp(),
    displayName,
    timezone,
    notificationPrefs: { enabled: true },
    dndSettings: { enabled: false },
  });

  const categoriesRef = collection(userRef, 'categories');
  await Promise.all(
    defaultCategories.map((category) => addDoc(categoriesRef, category))
  );
}

export async function getUserCategories(uid: string) {
  const categoriesSnap = await getDocs(collection(db, 'users', uid, 'categories'));
  return categoriesSnap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Category, 'id'>) }));
}

export async function createTask(uid: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
  const tasksRef = collection(db, 'users', uid, 'tasks');
  const docRef = await addDoc(tasksRef, {
    ...task,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTask(uid: string, taskId: string, data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) {
  const taskRef = doc(db, 'users', uid, 'tasks', taskId);
  await updateDoc(taskRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(uid: string, taskId: string) {
  const taskRef = doc(db, 'users', uid, 'tasks', taskId);
  await deleteDoc(taskRef);
}

export async function loadTasks(uid: string) {
  const tasksQuery = query(collection(db, 'users', uid, 'tasks'), orderBy('dueAtUtc', 'asc'));
  const snapshot = await getDocs(tasksQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Task) }));
}

export async function loadTask(uid: string, taskId: string) {
  const taskSnap = await getDoc(doc(db, 'users', uid, 'tasks', taskId));
  return taskSnap.exists() ? ({ id: taskSnap.id, ...(taskSnap.data() as Task) } as Task) : null;
}
