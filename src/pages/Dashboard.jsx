import React, { useState, useEffect } from 'react';
import { Plus, Flame, Trophy, Target, ChevronLeft, ChevronRight, Check, CalendarDays, Zap, TrendingUp, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHabits } from '../context/HabitContext';
import { format, subDays, addDays, getDay, isSameDay } from 'date-fns';
import HabitModal from '../components/HabitModal';
import HabitItem from '../components/HabitItem';
import MoodTracker from '../components/MoodTracker';
import AchievementsPanel from '../components/AchievementsPanel';

const QUOTES = [
  { text: "We are what we repeatedly do. Excellence is not an act, but a habit.", author: "Aristotle" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
  { text: "A habit is a formula our brain automatically follows.", author: "Charles Duhigg" },
  { text: "You'll never change your life until you change something you do daily.", author: "Mike Murdock" },
  { text: "Motivation gets you started. Habit keeps you going.", author: "Jim Ryun" },
  { text: "Your net worth to the world is usually determined by what remains after your bad habits are subtracted from your good ones.", author: "Benjamin Franklin" },
];

// Animated circular progress ring
const ProgressRing = ({ value, max, size = 120, strokeWidth = 10, color, children }) => {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference * (1 - pct);
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--bg-elevated)" strokeWidth={strokeWidth} fill="none" />
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      {children}
    </div>
  );
};

const Dashboard = () => {
  const { habits, tasks, getLogsForDate, userStats, updatePreferences, selectedDate, setSelectedDate, toggleTask, logs } = useHabits();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync state with browser history for back-button support
  useEffect(() => {
    if (isModalOpen) {
      window.history.pushState({ modal: true }, '');
    }
    const handlePopState = () => setIsModalOpen(false);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isModalOpen]);

  const currentDate = new Date(selectedDate);
  const todayStr = format(currentDate, 'EEEE, MMMM do');
  const logsToday = getLogsForDate(currentDate);
  const currentDayIndex = getDay(currentDate);

  // Daily quote — rotates by day of year
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const quote = QUOTES[dayOfYear % QUOTES.length];

  // Generate a strip of 7 days around the selected date
  const dateStrip = Array.from({ length: 7 }).map((_, idx) => {
    return subDays(currentDate, 3 - idx);
  });

  const activeHabitsForDate = habits.filter(h => h.status === 'active' && (h.frequencyDays?.includes(currentDayIndex) ?? true));
  const tasksForDate = tasks.filter(t => t.date === format(currentDate, 'yyyy-MM-dd'));

  const completedCount = activeHabitsForDate.filter(h => {
    const log = logsToday.find(l => l.habitId === h.id);
    if (!log) return false;
    const isAtMost = h.goalType === 'at_most';
    return isAtMost ? (log.completedAt && log.progress <= h.target) : (log.progress >= h.target);
  }).length;

  const totalActive = activeHabitsForDate.length;
  const progressPercent = totalActive > 0 ? (completedCount / totalActive) * 100 : 0;

  const morningHabits = activeHabitsForDate.filter(h => h.timeOfDay === 'Morning');
  const afternoonHabits = activeHabitsForDate.filter(h => h.timeOfDay === 'Afternoon');
  const eveningHabits = activeHabitsForDate.filter(h => h.timeOfDay === 'Evening');
  const anytimeHabits = activeHabitsForDate.filter(h => !['Morning','Afternoon','Evening'].includes(h.timeOfDay));

  const renderCategorizedList = (title, list) => {
    if (list.length === 0) return null;
    return (
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
          {title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <AnimatePresence>
            {list.map(habit => (
              <HabitItem key={habit.id} habit={habit} logs={logsToday} dateStr={format(currentDate, 'yyyy-MM-dd')} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const highPriorityTasks = tasksForDate.filter(t => !t.completed && t.priority === 'High').length;

  const generateInsight = () => {
    if (completedCount === totalActive && totalActive > 0) return `Amazing! You've crushed all ${totalActive} habits today. 🎯`;
    if (highPriorityTasks > 0) return `${highPriorityTasks} high-priority tasks need attention today.`;
    if (userStats.currentStreak >= 3) return `🔥 ${userStats.currentStreak}-day streak! Keep it up!`;
    if (progressPercent > 0 && progressPercent < 50) return `You're ${Math.round(progressPercent)}% through today. Keep pushing!`;
    if (totalActive - completedCount > 0) return `${totalActive - completedCount} habits left for today. You've got this!`;
    return "Let's make today a productive day. 💪";
  };

  const xpToNextLevel = ((userStats.level || 1) * 1000) - (userStats.xp || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ flex: '1 1 150px', minWidth: 0 }}>
          <h1 style={{ fontSize: 'clamp(24px, 8vw, 36px)', marginBottom: '8px', fontWeight: '800', letterSpacing: '-0.8px', wordBreak: 'break-word', lineHeight: 1.1 }}>
            {getGreeting()}{userStats.preferences?.name ? `, ${userStats.preferences.name}` : ''}
          </h1>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '8px',
            background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--stroke-subtle)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '300px', margin: '4px 0'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)', marginTop: '5px', flexShrink: 0 }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500', lineHeight: 1.4, wordBreak: 'break-word' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Tip:</strong> {generateInsight()}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexShrink: 0, position: 'relative' }}>
          <input 
            type="date" 
            id="hidden-date-picker"
            value={format(currentDate, 'yyyy-MM-dd')}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(new Date(e.target.value).toISOString());
            }}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
          />
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              const picker = document.getElementById('hidden-date-picker');
              if (picker.showPicker) picker.showPicker();
              else picker.click();
            }} 
            title="Select Date" 
            style={{ width: '40px', height: '40px', padding: '0', borderRadius: '10px' }}
          >
            <CalendarDays size={18} />
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={() => updatePreferences({ theme: userStats.preferences?.theme === 'light' ? 'dark' : 'light' })}
            title={userStats.preferences?.theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
            style={{ width: '40px', height: '40px', padding: '0', borderRadius: '10px' }}
          >
            {userStats.preferences?.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ height: '40px', padding: '0 12px', borderRadius: '10px', fontSize: '13px' }}>
             <Plus size={18} /> Add
          </button>
        </div>
      </div>

      {/* Daily Quote Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(216,75,107,0.12), rgba(142,68,173,0.1))',
          border: '1px solid rgba(216,75,107,0.2)',
          borderRadius: '20px',
          padding: '16px 20px',
          display: 'flex', gap: '16px', alignItems: 'center',
          maxWidth: '100%', overflow: 'hidden'
        }}
      >
        <div style={{ fontSize: '24px', flexShrink: 0 }}>💬</div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '4px', whiteSpace: 'normal', overflow: 'hidden' }}>
            "{quote.text}"
          </p>
          <p style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: '600' }}>— {quote.author}</p>
        </div>
      </motion.div>

      {/* Date Strip Calendar */}
      <div className="glass-panel" style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', overflow: 'hidden' }}>
        <button className="btn-icon" onClick={() => setSelectedDate(subDays(currentDate, 1).toISOString())}><ChevronLeft /></button>
        <div style={{ display: 'flex', gap: '4px', flex: 1, justifyContent: 'center', overflowX: 'auto', paddingBottom: '4px' }}>
          {dateStrip.map((d, i) => {
            const isSelected = isSameDay(d, currentDate);
            const isToday = isSameDay(d, new Date());
            const dayLogs = logs.filter(l => l.date === format(d, 'yyyy-MM-dd'));
            const hasActivity = dayLogs.some(l => {
              const h = habits.find(hb => hb.id === l.habitId);
              if (!h) return false;
              const isAtMost = h.goalType === 'at_most';
              return isAtMost ? (l.completedAt && l.progress <= h.target) : (l.progress >= h.target);
            });
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(d.toISOString())}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  padding: '10px 12px', borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: isSelected ? 'var(--accent-primary)' : isToday ? 'rgba(216,75,107,0.1)' : 'transparent',
                  color: isSelected ? '#fff' : isToday ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  position: 'relative', minWidth: '44px'
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>{format(d, 'EEE').charAt(0)}</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{format(d, 'd')}</span>
                {hasActivity && !isSelected && (
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-success)' }} />
                )}
              </button>
            );
          })}
        </div>
        <button className="btn-icon" onClick={() => setSelectedDate(addDays(currentDate, 1).toISOString())}><ChevronRight /></button>
      </div>

      {/* Hero Stats with Animated Rings */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {/* Habits Ring */}
        <div className="glass-panel" style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <ProgressRing value={completedCount} max={totalActive || 1} size={window.innerWidth < 450 ? 80 : 100} strokeWidth={8} color="var(--accent-primary)">
            <div style={{ textAlign: 'center', zIndex: 1 }}>
              <div style={{ fontSize: window.innerWidth < 450 ? '16px' : '22px', fontWeight: '800', lineHeight: 1 }}>{completedCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/{totalActive}</div>
            </div>
          </ProgressRing>
          <div style={{ minWidth: '100px', flex: 1 }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Habits Done</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-primary)' }}>{Math.round(progressPercent)}%</div>
          </div>
        </div>

        {/* Streak Ring */}
        <div className="glass-panel" style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <ProgressRing value={userStats.currentStreak || 0} max={Math.max(userStats.highestStreak || 7, 7)} size={window.innerWidth < 450 ? 80 : 100} strokeWidth={8} color="var(--accent-warning)">
            <div style={{ textAlign: 'center', zIndex: 1 }}>
              <Flame size={window.innerWidth < 450 ? 18 : 22} color="var(--accent-warning)" />
            </div>
          </ProgressRing>
          <div style={{ minWidth: '100px', flex: 1 }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Day Streak</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-warning)' }}>{userStats.currentStreak || 0}</div>
            {userStats.highestStreak > 0 && (
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Best: {userStats.highestStreak}</div>
            )}
          </div>
        </div>

        {/* XP Ring */}
        <div className="glass-panel" style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <ProgressRing value={(userStats.xp || 0) % 1000} max={1000} size={window.innerWidth < 450 ? 80 : 100} strokeWidth={8} color="#8e44ad">
            <div style={{ textAlign: 'center', zIndex: 1 }}>
              <Zap size={window.innerWidth < 450 ? 18 : 22} color="#8e44ad" />
            </div>
          </ProgressRing>
          <div style={{ minWidth: '100px', flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Level {userStats.level || 1}</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#8e44ad', lineHeight: 1 }}>{userStats.xp || 0} XP</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>to next level</div>
          </div>
        </div>
      </div>

      {/* Achievements Panel */}
      <AchievementsPanel userStats={userStats} logs={logs} habits={habits} />

      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 900 ? '1fr' : '1fr 360px', gap: '24px' }}>

        {/* Left Column: Habits */}
        <div>
          <div className="glass-panel" style={{ padding: '20px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontWeight: '600', fontSize: '15px' }}>Today's Progress</span>
              <span style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>{Math.round(progressPercent)}%</span>
            </div>
            <div style={{ height: '10px', background: 'var(--bg-elevated)', borderRadius: '99px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ height: '100%', background: progressPercent === 100 ? 'linear-gradient(90deg, var(--accent-success), #1abc9c)' : 'linear-gradient(90deg, var(--accent-primary), #8e44ad)', borderRadius: '99px' }}
              />
            </div>
            {progressPercent === 100 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '12px', textAlign: 'center', color: 'var(--accent-success)', fontSize: '14px', fontWeight: '600' }}>
                🎉 All habits completed for today!
              </motion.div>
            )}
          </div>

          <div>
            {activeHabitsForDate.length === 0 ? (
              <div style={{ 
                textAlign: 'center', padding: '48px 24px', border: '2px dashed var(--stroke-subtle)', borderRadius: '24px',
                background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
              }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <Zap size={32} color="var(--accent-primary)" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>
                  {habits.length === 0 ? "Your habbitz journey starts here!" : `No habits scheduled for ${format(currentDate, 'EEE')}`}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '280px', margin: '0 auto', lineHeight: 1.5 }}>
                  {habits.length === 0 
                    ? "Start by adding your first habit to build your daily routine." 
                    : "Take a breather or add a one-time activity for today."}
                </p>
                {habits.length === 0 && (
                  <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ marginTop: '8px' }}>
                    <Plus size={18} /> Create First Habit
                  </button>
                )}
              </div>
            ) : (
              <>
                {renderCategorizedList('Morning Routine', morningHabits)}
                {renderCategorizedList('Afternoon Focus', afternoonHabits)}
                {renderCategorizedList('Evening Wind Down', eveningHabits)}
                {renderCategorizedList('Anytime', anytimeHabits)}
              </>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Mood Tracker */}
          <MoodTracker />

          {/* To-Do List */}
          <div>
            <h2 style={{ fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              To-Do List
              <div style={{ fontSize: '13px', background: 'var(--bg-elevated)', padding: '4px 12px', borderRadius: '99px', color: 'var(--text-secondary)' }}>
                {tasksForDate.filter(t => t.completed).length}/{tasksForDate.length}
              </div>
            </h2>
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tasksForDate.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)',
                  border: '1px solid var(--stroke-subtle)', borderRadius: '16px', background: 'rgba(255,255,255,0.01)'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>✨</div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>Clear sky for today</div>
                  <div style={{ fontSize: '12px', opacity: 0.6 }}>No tasks on your plate.</div>
                </div>
              ) : (
                tasksForDate.map(task => (
                  <motion.div
                    key={task.id}
                    layout
                    whileHover={{ x: 4 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: task.completed ? 'transparent' : 'var(--bg-elevated)', borderRadius: '12px', border: `1px solid ${task.completed ? 'transparent' : 'var(--stroke-subtle)'}`, transition: 'all 0.2s' }}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      style={{ width: '24px', height: '24px', borderRadius: '8px', border: task.completed ? 'none' : '2px solid var(--stroke-strong)', background: task.completed ? 'var(--accent-success)' : 'transparent', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                    >
                      {task.completed && <Check size={14} />}
                    </button>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '14px', color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                        {task.name}
                      </span>
                      {task.priority === 'High' && !task.completed && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', background: 'rgba(231,76,60,0.2)', color: '#e74c3c', padding: '2px 8px', borderRadius: '99px', fontWeight: '600' }}>HIGH</span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {isModalOpen && <HabitModal onClose={() => setIsModalOpen(false)} selectedDate={currentDate} />}
    </div>
  );
};

export default Dashboard;
