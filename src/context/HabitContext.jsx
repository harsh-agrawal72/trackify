import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format, isSameDay, subDays } from 'date-fns';
import { showXPToast } from '../components/XPToast';

const HabitContext = createContext();

export const useHabits = () => useContext(HabitContext);

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
    const newValue = localStorage.getItem(`habbitz_${key}`);
    if (newValue) return JSON.parse(newValue);
    
    const habitzzValue = localStorage.getItem(`habitzz_${key}`);
    if (habitzzValue) return JSON.parse(habitzzValue);
    
    const trackifyValue = localStorage.getItem(`trackify_${key}`);
    if (trackifyValue) return JSON.parse(trackifyValue);
    
    const momentumValue = localStorage.getItem(`momentum_${key}`);
    if (momentumValue) return JSON.parse(momentumValue);
    
    return defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

export const HabitProvider = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString());
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

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return 'unsupported';
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission;
  };

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
    console.log(`[Notification Service] Attempting to send: "${title}"`, { permission: Notification.permission, state: notificationPermission });
    
    // Play sound fallback if enabled
    if (userStats.preferences?.sound !== false) {
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play();
        console.log("[Notification Service] Audio chime played.");
      } catch (audioError) {
        console.warn("[Notification Service] Could not play audio chime", audioError);
      }
    }

    if (Notification.permission !== 'granted') {
      console.warn("[Notification Service] Permission not granted at browser level.");
      return;
    }
    
    const options = {
      body,
      tag: tag || 'habit-reminder',
      icon: `/pwa-192x192.png?v=${Date.now()}`,
      badge: `/pwa-192x192.png?v=${Date.now()}`,
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      requireInteraction: true // Keeps the notification visible until user interacts
    };
    
    try {
      // Try using Service Worker registration first (better for PWA)
      if ('serviceWorker' in navigator) {
        // Use a timeout promise to avoid hanging forever
        const swReadyPromise = navigator.serviceWorker.ready;
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SW Timeout')), 2000));
        
        try {
          const registration = await Promise.race([swReadyPromise, timeoutPromise]);
          if (registration && registration.showNotification) {
            await registration.showNotification(title, options);
            console.log("[Notification Service] Sent via Service Worker");
            return;
          }
        } catch (swError) {
          console.warn("[Notification Service] Service Worker not ready in time, falling back to standard API.", swError);
        }
      }
      
      // Fallback to standard Notification API
      new Notification(title, options);
      console.log("[Notification Service] Sent via standard API");
    } catch (e) {
      console.error("[Notification Service] Error sending notification:", e);
    }
  }, [notificationPermission]);

  useEffect(() => {
    localStorage.setItem('habbitz_categories', JSON.stringify(categories));
    localStorage.setItem('habbitz_habits', JSON.stringify(habits));
    localStorage.setItem('habbitz_tasks', JSON.stringify(tasks));
    localStorage.setItem('habbitz_logs', JSON.stringify(logs));
    localStorage.setItem('habbitz_stats', JSON.stringify(userStats));
    localStorage.setItem('habbitz_focus_sessions', JSON.stringify(focusSessions));
  }, [categories, habits, tasks, logs, userStats, focusSessions]);

  useEffect(() => {
    const accent = userStats?.preferences?.accentColor || '#D84B6B';
    document.documentElement.style.setProperty('--accent-primary', accent);
  }, [userStats?.preferences?.accentColor]);
  
  useEffect(() => {
    const theme = userStats.preferences?.theme || 'dark';
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [userStats.preferences?.theme]);

  const addFocusSession = useCallback((session) => {
    setFocusSessions(prev => [{ id: uuidv4(), ...session, completedAt: new Date().toISOString() }, ...prev].slice(0, 50));
  }, []);

  const addHabit = useCallback((data) => setHabits(prev => [...prev, { id: uuidv4(), createdAt: new Date().toISOString(), status: 'active', streak: 0, ...data }]), []);
  const editHabit = useCallback((id, upd) => setHabits(prev => prev.map(h => h.id === id ? { ...h, ...upd } : h)), []);
  const deleteHabit = useCallback((id) => setHabits(prev => prev.filter(h => h.id !== id)), []);
  
  const resetNotificationFlags = useCallback(() => {
    setHabits(prev => prev.map(h => ({ ...h, lastNotified: undefined, lastNotifiedTs: 0 })));
    setTasks(prev => prev.map(t => ({ ...t, lastNotified: undefined })));
  }, []);
  
  const addTask = useCallback((data) => setTasks(prev => [...prev, { id: uuidv4(), createdAt: new Date().toISOString(), completed: false, ...data }]), []);
  const editTask = useCallback((id, upd) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...upd } : t)), []);
  const deleteTask = useCallback((id) => setTasks(prev => prev.filter(t => t.id !== id)), []);

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

  const addCategory = useCallback((data) => setCategories(prev => [...prev, { id: uuidv4(), ...data }]), []);
  const editCategory = useCallback((id, upd) => setCategories(prev => prev.map(c => c.id === id ? { ...c, ...upd } : c)), []);
  const deleteCategory = useCallback((id) => setCategories(prev => prev.filter(c => c.id !== id)), []);

  const updatePreferences = useCallback((updates) => {
    setUserStats(prev => ({ ...prev, preferences: { ...prev.preferences, ...updates } }));
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
        const todayActiveDayHabits = habits.filter(h => h.status === 'active' && (h.frequencyDays || [0,1,2,3,4,5,6]).includes(new Date(dateStr).getDay()));
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
  }, [logs, habits, selectedDate, calculateEntityXP, updateXP]);

  const clearFocusSessions = useCallback(() => setFocusSessions([]), []);

  // background reminder checker
  useEffect(() => {
    if (notificationPermission !== 'granted') return;

    const checkReminders = async () => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = format(now, 'HH:mm');
      const todayStr = format(now, 'yyyy-MM-dd');
      
      console.log(`[Reminder Check] Time: ${currentTime}, Habits count: ${habits.length}`);

      // Check Habits
      for (const habit of habits) {
        if (habit.status !== 'active') continue;
        if (!habit.reminderTime) continue;
        if (!(habit.frequencyDays || [0,1,2,3,4,5,6]).includes(currentDay)) continue;
        
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
                console.log(`Triggering Interval START for habit: ${habit.name}`);
                await sendNotification(`Habit Reminder: ${habit.name}`, `Time for your regular check!`, `habit-${habit.id}`);
                showXPToast(`Reminder: ${habit.name}`, 0, 'task'); // UI Fallback
                editHabit(habit.id, { lastNotified: todayStr, lastNotifiedTs: Date.now() });
             }
             continue;
          }

          if (Date.now() - lastNotifiedTs >= intervalMs) {
             console.log(`Triggering Interval REPEAT for habit: ${habit.name}`);
             await sendNotification(`Habit Reminder: ${habit.name}`, `It's been ${habit.reminderInterval} mins, time to go again!`, `habit-${habit.id}`);
             showXPToast(`Reminder: ${habit.name}`, 0, 'task'); // UI Fallback
             editHabit(habit.id, { lastNotified: todayStr, lastNotifiedTs: Date.now() });
          }
        } else {
          // Fixed time logic
          if (habit.lastNotified === todayStr) continue;
          if (habit.reminderTime <= currentTime) {
            console.log(`Triggering FIXED reminder for habit: ${habit.name}`);
            await sendNotification(`Habit Reminder: ${habit.name}`, `Time to work on your habit!`, `habit-${habit.id}`);
            showXPToast(`Reminder: ${habit.name}`, 0, 'task'); // UI Fallback
            editHabit(habit.id, { lastNotified: todayStr });
          }
        }
      }

      // Check Tasks
      tasks.forEach(task => {
        if (task.completed) return;
        if (!task.reminderTime) return;
        if (task.lastNotified === todayStr) return;

        // Check if it's for today
        const taskDate = task.date || task.startDate; // single tasks have date, recurring tasks have startDate
        if (taskDate && !isSameDay(new Date(taskDate), now) && task.type !== 'recurring_task') return;

        if (task.type === 'recurring_task') {
           if (!(task.frequencyDays || [0,1,2,3,4,5,6]).includes(currentDay)) return;
        }

        if (task.reminderTime <= currentTime) {
          sendNotification(`Task Reminder: ${task.name}`, `Don't forget to complete your task!`, `task-${task.id}`);
          editTask(task.id, { lastNotified: todayStr });
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // check every minute
    checkReminders(); // check immediately on mount/update
    return () => clearInterval(interval);
  }, [habits, tasks, logs, notificationPermission, sendNotification, editHabit, editTask]);

  const value = useMemo(() => ({
    categories, habits, tasks, logs, selectedDate, setSelectedDate, userStats, setUserStats, focusSessions, notificationPermission, requestNotificationPermission, sendNotification, resetNotificationFlags,
    addCategory, editCategory, deleteCategory, addHabit, editHabit, deleteHabit, addTask, editTask, toggleTask, deleteTask, getLogsForDate, logHabitProgress, updatePreferences, resetData, addFocusSession, clearFocusSessions
  }), [
    categories, habits, tasks, logs, selectedDate, userStats, focusSessions, notificationPermission, requestNotificationPermission, sendNotification, resetNotificationFlags,
    addCategory, editCategory, deleteCategory, addHabit, editHabit, deleteHabit, addTask, editTask, toggleTask, deleteTask, getLogsForDate, logHabitProgress, updatePreferences, resetData, addFocusSession, clearFocusSessions
  ]);

  return (
    <HabitContext.Provider value={value}>
      {children}
    </HabitContext.Provider>
  );
};
