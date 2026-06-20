import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format, isSameDay, subDays } from 'date-fns';
import { showXPToast } from '../components/XPToast';
import { useAuth } from '../components/AuthGuard';
import { loadUserData, saveItem, deleteItem, saveStats, migrateFromLocalStorage, savePushSubscription } from '../firebase/db';
import { signOut } from '../firebase/auth';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const HabitDataContext = createContext();
const HabitActionsContext = createContext();

export const useHabits = () => {
  const data = useContext(HabitDataContext);
  const actions = useContext(HabitActionsContext);
  if (!data || !actions) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return { ...data, ...actions };
};

// More granular hooks for better performance
export const useHabitData = () => useContext(HabitDataContext);
export const useHabitActions = () => useContext(HabitActionsContext);

const ACCENT_COLORS = [
  { name: 'Teal', color: '#0097a7' },
  { name: 'Orange', color: '#f39c12' },
  { name: 'Purple', color: '#8e44ad' },
  { name: 'Rose', color: '#D84B6B' },
  { name: 'Blue', color: '#3498db' },
  { name: 'Green', color: '#2ecc71' }
];

const defaultCategories = [
  { id: '1', name: 'Work', color: 'var(--cat-purple)', icon: 'Briefcase' },
  { id: '2', name: 'Health', color: 'var(--cat-yellow)', icon: 'Activity' },
  { id: '3', name: 'Personal', color: 'var(--cat-red)', icon: 'User' },
  { id: '4', name: 'Study', color: 'var(--cat-pink)', icon: 'Book' },
];

const getInitialValue = (key, defaultValue) => {
  try {
    const keys = ['habbitz_', 'habitzz_', 'trackify_', 'momentum_'];
    for (const prefix of keys) {
      const val = localStorage.getItem(`${prefix}${key}`);
      if (val) return JSON.parse(val);
    }
    return defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

export const HabitProvider = ({ children }) => {
  const user = useAuth(); // Firebase user
  const uid = user?.uid;
  const [firestoreReady, setFirestoreReady] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString());
  const [notificationPermission, setNotificationPermission] = useState('Notification' in window ? Notification.permission : 'unsupported');

  const [categories, setCategories] = useState(() => getInitialValue('categories', defaultCategories));
  const [habits, setHabits] = useState(() => getInitialValue('habits', []));
  const [tasks, setTasks] = useState(() => getInitialValue('tasks', []));
  const [logs, setLogs] = useState(() => getInitialValue('logs', []));
  const [userStats, setUserStats] = useState(() => {
    const def = { xp: 0, level: 1, currentStreak: 0, highestStreak: 0, lastActive: null, moodLogs: {}, hadPerfectDay: false, preferences: { sound: true, name: 'User', accentColor: '#0097a7', theme: 'dark' } };
    const val = getInitialValue('stats', def);
    return { ...def, ...val };
  });
  const [focusSessions, setFocusSessions] = useState(() => getInitialValue('focus_sessions', []));

  // ── Load from Firestore on login ──────────────────────────
  useEffect(() => {
    if (!uid) return;
    const init = async () => {
      try {
        // Migrate localStorage to Firestore on first login
        const migrated = localStorage.getItem('habbitz_migrated');
        if (!migrated || migrated !== uid) {
          await migrateFromLocalStorage(uid);
        }

        // Load all data from Firestore
        const data = await loadUserData(uid);
        const defaultStats = { xp: 0, level: 1, currentStreak: 0, highestStreak: 0, lastActive: null, moodLogs: {}, hadPerfectDay: false, preferences: { sound: true, name: user.displayName || 'User', accentColor: '#0097a7', theme: 'dark' } };

        if (data.habits?.length) setHabits(data.habits);
        if (data.tasks?.length) setTasks(data.tasks);
        if (data.logs?.length) setLogs(data.logs);
        if (data.categories?.length) setCategories(data.categories);
        if (data.focusSessions?.length) setFocusSessions(data.focusSessions);
        if (data.stats) setUserStats(prev => ({ ...defaultStats, ...prev, ...data.stats }));

        setFirestoreReady(true);
        console.log('[Firebase] Data loaded ✅');
        
        // Silent push auto-sync if permission already granted
        if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(async (registration) => {
            let subscription = await registration.pushManager.getSubscription();
            if (!subscription && import.meta.env.VITE_VAPID_PUBLIC_KEY) {
              subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
              });
              if (subscription) await savePushSubscription(uid, subscription);
            }
          }).catch(console.warn);
        }
      } catch (e) {
        console.error('[Firebase] Load error:', e);
        setFirestoreReady(true); // fallback to localStorage
      }
    };
    init();
  }, [uid]);

  // ── Sync helpers: save to Firestore after state updates ───
  const syncItem = useCallback((colName, item) => {
    if (uid && firestoreReady) saveItem(uid, colName, item).catch(console.error);
  }, [uid, firestoreReady]);

  const removeItem = useCallback((colName, itemId) => {
    if (uid && firestoreReady) deleteItem(uid, colName, itemId).catch(console.error);
  }, [uid, firestoreReady]);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported';
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    
    if (permission === 'granted' && uid && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (!registration) alert("SW Registration failed!");

        let subscription = await registration.pushManager.getSubscription();
        if (subscription) await subscription.unsubscribe();

        const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (publicVapidKey) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
          });
          if (subscription) {
            await savePushSubscription(uid, subscription);
            alert("[Push] Subscription successful and saved to Firestore!");
          } else {
            alert("Subscription object is null after subscribing!");
          }
        } else {
          alert("ERROR: VITE_VAPID_PUBLIC_KEY is NOT defined in Vercel!");
        }
      } catch (err) {
        alert("Push Setup Error: " + err.message);
        console.error(err);
      }
    } else {
      alert(`Conditions failed: perm=${permission}, uid=${uid}, sw=${'serviceWorker' in navigator}`);
    }
    
    return permission;
  }, [uid]);

  // Sync permission state when window is focused
  useEffect(() => {
    const syncPermission = () => {
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
    };

    window.addEventListener('focus', syncPermission);
    return () => window.removeEventListener('focus', syncPermission);
  }, []);

  const sendNotification = useCallback(async (title, body, tag) => {
    if (userStats.preferences?.sound !== false) {
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play();
      } catch (audioError) {
        console.warn("[Notification Service] Could not play audio chime", audioError);
      }
    }

    if (Notification.permission !== 'granted') return;

    const options = {
      body,
      tag: tag || 'habit-reminder',
      icon: `/pwa-192x192.png?v=${Date.now()}`,
      badge: `/pwa-192x192.png?v=${Date.now()}`,
      vibrate: [100, 50, 100],
      requireInteraction: true
    };

    try {
      if ('serviceWorker' in navigator) {
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) => setTimeout(() => reject(new Error('SW Timeout')), 2000))
        ]);
        if (registration && registration.showNotification) {
          await registration.showNotification(title, options);
          return;
        }
      }
      new Notification(title, options);
    } catch (e) {
      console.error("[Notification Service] Error sending notification:", e);
    }
  }, [userStats.preferences?.sound]);

  // Bulk sync to localStorage (debounced or optimized)
  useEffect(() => {
    const data = { categories, habits, tasks, logs, stats: userStats, focus_sessions: focusSessions };
    Object.entries(data).forEach(([key, val]) => {
      localStorage.setItem(`habbitz_${key}`, JSON.stringify(val));
    });
  }, [categories, habits, tasks, logs, userStats, focusSessions]);

  useEffect(() => {
    const accent = userStats?.preferences?.accentColor || '#0097a7';
    document.documentElement.style.setProperty('--accent-primary', accent);
  }, [userStats?.preferences?.accentColor]);

  useEffect(() => {
    const theme = userStats.preferences?.theme || 'dark';
    document.documentElement.classList.toggle('light-mode', theme === 'light');
  }, [userStats.preferences?.theme]);

  const addFocusSession = useCallback((session) => {
    const newSession = { id: uuidv4(), ...session, completedAt: new Date().toISOString() };
    setFocusSessions(prev => [newSession, ...prev].slice(0, 50));
    syncItem('focusSessions', newSession);
  }, [syncItem]);

  const addHabit = useCallback((data) => {
    const newHabit = { id: uuidv4(), createdAt: new Date().toISOString(), status: 'active', streak: 0, ...data };
    setHabits(prev => [...prev, newHabit]);
    syncItem('habits', newHabit);
  }, [syncItem]);
  const editHabit = useCallback((id, upd) => {
    setHabits(prev => {
      const updated = prev.map(h => h.id === id ? { ...h, ...upd } : h);
      const item = updated.find(h => h.id === id);
      if (item) syncItem('habits', item);
      return updated;
    });
  }, [syncItem]);
  const deleteHabit = useCallback((id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    removeItem('habits', id);
  }, [removeItem]);

  const resetNotificationFlags = useCallback(() => {
    setHabits(prev => prev.map(h => ({ ...h, lastNotified: undefined, lastNotifiedTs: 0 })));
    setTasks(prev => prev.map(t => ({ ...t, lastNotified: undefined })));
  }, []);

  const addTask = useCallback((data) => {
    const newTask = { id: uuidv4(), createdAt: new Date().toISOString(), completed: false, ...data };
    setTasks(prev => [...prev, newTask]);
    syncItem('tasks', newTask);
  }, [syncItem]);
  const editTask = useCallback((id, upd) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...upd } : t);
      const item = updated.find(t => t.id === id);
      if (item) syncItem('tasks', item);
      return updated;
    });
  }, [syncItem]);
  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    removeItem('tasks', id);
  }, [removeItem]);

  const calculateEntityXP = useCallback((entity) => {
    const base = entity.type === 'habit' ? 50 : 30;
    const bonus = entity.priority === 'High' ? 25 : entity.priority === 'Medium' ? 10 : 0;
    return base + bonus;
  }, []);

  const updateXP = useCallback((amount, label, type, customMessage) => {
    if (amount === 0) return;
    const message = customMessage || (amount > 0 ? `${label} done!` : `${label} undone`);
    showXPToast(message, amount, type);
    setUserStats(prev => {
      const newXp = Math.max(0, prev.xp + amount);
      const newLevel = Math.floor(newXp / 1000) + 1;
      const clampedLevel = Math.max(prev.level, newLevel);
      if (clampedLevel > prev.level && amount > 0) {
        setTimeout(() => showXPToast(`Level Up! You're now Level ${clampedLevel}! 🎉`, 0, 'achievement'), 500);
      }
      return { ...prev, xp: newXp, level: clampedLevel };
    });
  }, []);

  const toggleTask = useCallback((id) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (task) {
        const xp = calculateEntityXP(task);
        updateXP(task.completed ? -xp : xp, task.name, 'task');
      }
      return prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    });
  }, [calculateEntityXP, updateXP]);

  const addCategory = useCallback((data) => {
    const newCat = { id: uuidv4(), ...data };
    setCategories(prev => [...prev, newCat]);
    syncItem('categories', newCat);
  }, [syncItem]);
  const editCategory = useCallback((id, upd) => {
    setCategories(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...upd } : c);
      const item = updated.find(c => c.id === id);
      if (item) syncItem('categories', item);
      return updated;
    });
  }, [syncItem]);
  const deleteCategory = useCallback((id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    removeItem('categories', id);
  }, [removeItem]);

  const updatePreferences = useCallback((updates) => {
    setUserStats(prev => ({ ...prev, preferences: { ...prev.preferences, ...updates } }));
  }, []);

  const logout = useCallback(async () => {
    await signOut();
  }, []);

  const resetData = useCallback(() => {
    setHabits([]); setTasks([]); setLogs([]);
    setUserStats({ xp: 0, level: 1, currentStreak: 0, highestStreak: 0, lastActive: null, moodLogs: {}, preferences: { sound: true, name: 'User' } });
  }, []);

  const getLogsForDate = useCallback((date) => {
    const ds = format(new Date(date), 'yyyy-MM-dd');
    return logs.filter(log => log.date === ds);
  }, [logs]);

  const logHabitProgress = useCallback((habitId, amount = 1, date = new Date(selectedDate)) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingIndex = logs.findIndex(l => l.habitId === habitId && l.date === dateStr);
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    let newLogs = [...logs];
    let isCompletedToday = false;
    const isAtMost = habit.goalType === 'at_most';

    const checkSuccess = (h, prog) => {
      if (h.goalType === 'at_most') {
        if (h.targetUnit === 'binary') return prog === 0;
        return prog <= h.target;
      }
      return prog >= h.target;
    };

    if (existingIndex >= 0) {
      const oldProgress = newLogs[existingIndex].progress;
      const wasSuccessful = checkSuccess(habit, oldProgress);
      const wasConfirmedDone = !!newLogs[existingIndex].completedAt;

      if (amount === 0 && isAtMost) {
        if (oldProgress <= habit.target) {
          const togglingOn = !wasConfirmedDone;
          newLogs[existingIndex].completedAt = togglingOn ? new Date().toISOString() : null;
          updateXP(togglingOn ? calculateEntityXP(habit) : -calculateEntityXP(habit), habit.name, 'habit', togglingOn ? "Stayed Safe! ✨" : "Success Untoggled");
          setLogs(newLogs);
          return;
        }
      }

      if (!isAtMost && amount > 0 && wasSuccessful) {
        const xp = calculateEntityXP(habit);
        updateXP(-xp, habit.name, 'habit');
        newLogs.splice(existingIndex, 1);
        setLogs(newLogs);
        return;
      } else {
        const maxLimit = isAtMost ? Infinity : habit.target;
        newLogs[existingIndex].progress = Math.max(0, Math.min(oldProgress + amount, maxLimit));
        const newProgress = newLogs[existingIndex].progress;
        const isSuccessfulNow = checkSuccess(habit, newProgress);

        if (isSuccessfulNow && !wasSuccessful) {
          const xp = calculateEntityXP(habit);
          updateXP(xp, habit.name, 'habit', isAtMost ? "Status Restored! ✨" : undefined);
          if (!isAtMost) isCompletedToday = true;
        } else if (!isSuccessfulNow && wasSuccessful) {
          const xp = calculateEntityXP(habit);
          updateXP(-xp, habit.name, 'habit', isAtMost ? "Limit Exceeded! ⚠️" : undefined);
        }
      }
    } else {
      if (amount === 0 && isAtMost) {
        newLogs.push({ id: uuidv4(), habitId, date: dateStr, progress: 0, completedAt: new Date().toISOString() });
        updateXP(calculateEntityXP(habit), habit.name, 'habit', "Stayed Safe! ✨");
        setLogs(newLogs);
        return;
      }
      if (amount <= 0 && !isAtMost) return;

      const newProgress = amount;
      const isSuccessfulNow = checkSuccess(habit, newProgress);

      newLogs.push({
        id: uuidv4(), habitId, date: dateStr, progress: newProgress,
        completedAt: (!isAtMost && isSuccessfulNow) ? new Date().toISOString() : null
      });

      if (!isAtMost && isSuccessfulNow) isCompletedToday = true;
      if (isAtMost && !isSuccessfulNow) {
        updateXP(-calculateEntityXP(habit), habit.name, 'habit', "Limit Exceeded! ⚠️");
      } else if (!isAtMost && isSuccessfulNow) {
        updateXP(calculateEntityXP(habit), habit.name, 'habit');
      }
    }
    setLogs(newLogs);

    if (isCompletedToday) {
      setUserStats(prev => {
        const todayActiveDayHabits = habits.filter(h => h.status === 'active' && (h.frequencyDays || [0, 1, 2, 3, 4, 5, 6]).includes(new Date(dateStr).getDay()));
        const completedAfter = [...newLogs].filter(l => {
          const h = habits.find(hb => hb.id === l.habitId);
          if (!h) return false;
          return h.goalType === 'at_most' ? (l.completedAt && l.progress <= h.target) : l.progress >= h.target;
        });
        const isPerfectDay = todayActiveDayHabits.length > 0 && completedAfter.length >= todayActiveDayHabits.length;
        if (isPerfectDay && !prev.hadPerfectDay) {
          setTimeout(() => showXPToast('Perfect Day! All habits done! 🌟', 100, 'achievement'), 800);
          return { ...prev, xp: prev.xp + 100, hadPerfectDay: true };
        }
        return { ...prev, hadPerfectDay: isPerfectDay || prev.hadPerfectDay };
      });
    }
  }, [logs, habits, selectedDate, calculateEntityXP, updateXP, syncItem]);

  const clearFocusSessions = useCallback(() => setFocusSessions([]), []);

  // Background reminder checker
  useEffect(() => {
    if (notificationPermission !== 'granted') return;

    const checkReminders = async () => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = format(now, 'HH:mm');
      const todayStr = format(now, 'yyyy-MM-dd');

      for (const habit of habits) {
        if (habit.status !== 'active') continue;
        if (!habit.reminderTime) continue;
        if (!(habit.frequencyDays || [0, 1, 2, 3, 4, 5, 6]).includes(currentDay)) continue;

        const log = logs.find(l => l.habitId === habit.id && l.date === todayStr);
        const isDone = log ? (habit.goalType === 'at_most' ? (log.completedAt && log.progress <= habit.target) : log.progress >= habit.target) : false;
        if (isDone) continue;

        if (habit.reminderType === 'interval') {
          const intervalMs = (habit.reminderInterval || 60) * 60000;
          const lastNotifiedTs = habit.lastNotifiedTs || 0;
          const lastNotifiedDay = habit.lastNotified;
          const endTime = habit.reminderEndTime || '23:59';

          if (currentTime > endTime) continue;

          if (lastNotifiedDay !== todayStr) {
            if (habit.reminderTime <= currentTime) {
              await sendNotification(`Habit Reminder: ${habit.name}`, `Time for your regular check!`, `habit-${habit.id}`);
              showXPToast(`Reminder: ${habit.name}`, 0, 'task');
              editHabit(habit.id, { lastNotified: todayStr, lastNotifiedTs: Date.now() });
            }
            continue;
          }

          if (Date.now() - lastNotifiedTs >= intervalMs) {
            await sendNotification(`Habit Reminder: ${habit.name}`, `It's been ${habit.reminderInterval} mins, time to go again!`, `habit-${habit.id}`);
            showXPToast(`Reminder: ${habit.name}`, 0, 'task');
            editHabit(habit.id, { lastNotified: todayStr, lastNotifiedTs: Date.now() });
          }
        } else {
          if (habit.lastNotified === todayStr) continue;
          if (habit.reminderTime <= currentTime) {
            await sendNotification(`Habit Reminder: ${habit.name}`, `Time to work on your habit!`, `habit-${habit.id}`);
            showXPToast(`Reminder: ${habit.name}`, 0, 'task');
            editHabit(habit.id, { lastNotified: todayStr });
          }
        }
      }

      tasks.forEach(task => {
        if (task.completed || !task.reminderTime || task.lastNotified === todayStr) return;
        const taskDate = task.date || task.startDate;
        if (taskDate && !isSameDay(new Date(taskDate), now) && task.type !== 'recurring_task') return;
        if (task.type === 'recurring_task' && !(task.frequencyDays || [0, 1, 2, 3, 4, 5, 6]).includes(currentDay)) return;

        if (task.reminderTime <= currentTime) {
          sendNotification(`Task Reminder: ${task.name}`, `Don't forget to complete your task!`, `task-${task.id}`);
          editTask(task.id, { lastNotified: todayStr });
        }
      });
    };

    const interval = setInterval(checkReminders, 60000);
    checkReminders();
    return () => clearInterval(interval);
  }, [habits, tasks, logs, notificationPermission, sendNotification, editHabit, editTask]);

  // Sync stats to Firestore whenever they change (debounced)
  const statsTimerRef = useRef(null);
  useEffect(() => {
    if (!uid || !firestoreReady) return;
    clearTimeout(statsTimerRef.current);
    statsTimerRef.current = setTimeout(() => {
      saveStats(uid, userStats).catch(console.error);
    }, 1500);
    return () => clearTimeout(statsTimerRef.current);
  }, [userStats, uid, firestoreReady]);

  // Sync logs to Firestore whenever they change
  const prevLogsRef = useRef(logs);
  useEffect(() => {
    if (!uid || !firestoreReady) return;
    const prev = prevLogsRef.current;
    const added = logs.filter(l => !prev.find(p => p.id === l.id));
    const removed = prev.filter(p => !logs.find(l => l.id === p.id));
    const updated = logs.filter(l => {
      const old = prev.find(p => p.id === l.id);
      return old && JSON.stringify(old) !== JSON.stringify(l);
    });
    [...added, ...updated].forEach(l => syncItem('logs', l));
    removed.forEach(l => removeItem('logs', l.id));
    prevLogsRef.current = logs;
  }, [logs, uid, firestoreReady, syncItem, removeItem]);

  const dataValue = useMemo(() => ({
    categories, habits, tasks, logs, selectedDate, userStats, focusSessions, notificationPermission,
    currentUser: user, firestoreReady,
  }), [categories, habits, tasks, logs, selectedDate, userStats, focusSessions, notificationPermission, user, firestoreReady]);

  const actionsValue = useMemo(() => ({
    setSelectedDate, requestNotificationPermission, sendNotification, resetNotificationFlags,
    addCategory, editCategory, deleteCategory, addHabit, editHabit, deleteHabit, addTask, editTask, toggleTask, deleteTask, getLogsForDate, logHabitProgress, updatePreferences, resetData, addFocusSession, clearFocusSessions, logout,
  }), [
    setSelectedDate, requestNotificationPermission, sendNotification, resetNotificationFlags,
    addCategory, editCategory, deleteCategory, addHabit, editHabit, deleteHabit, addTask, editTask, toggleTask, deleteTask, getLogsForDate, logHabitProgress, updatePreferences, resetData, addFocusSession, clearFocusSessions, logout,
  ]);

  return (
    <HabitDataContext.Provider value={dataValue}>
      <HabitActionsContext.Provider value={actionsValue}>
        {children}
      </HabitActionsContext.Provider>
    </HabitDataContext.Provider>
  );
};

