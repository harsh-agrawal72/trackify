import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHabits } from '../context/HabitContext';
import { format } from 'date-fns';

const moods = [
  { emoji: '😞', label: 'Rough', value: 1, color: '#e74c3c' },
  { emoji: '😕', label: 'Meh', value: 2, color: '#e67e22' },
  { emoji: '😐', label: 'Okay', value: 3, color: '#f1c40f' },
  { emoji: '😊', label: 'Good', value: 4, color: '#2ecc71' },
  { emoji: '🤩', label: 'Amazing', value: 5, color: '#3498db' },
];

const MoodTracker = () => {
  const { userStats, setUserStats } = useHabits();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayMood = userStats?.moodLogs?.[todayStr];
  const [hoveredMood, setHoveredMood] = useState(null);
  const [justLogged, setJustLogged] = useState(false);

  const logMood = (mood) => {
    setUserStats(prev => ({
      ...prev,
      moodLogs: { ...(prev.moodLogs || {}), [todayStr]: mood }
    }));
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 2000);
  };

  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderRadius: '20px',
      padding: '24px',
      border: '1px solid var(--stroke-subtle)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '2px' }}>How are you feeling?</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Track your mood daily</p>
        </div>
        {todayMood && (
          <div style={{ fontSize: '28px' }}>{moods[todayMood.value - 1]?.emoji}</div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {justLogged ? (
          <motion.div
            key="logged"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '12px', color: 'var(--accent-success)', fontWeight: '600' }}
          >
            ✅ Mood logged!
          </motion.div>
        ) : (
          <motion.div
            key="picker"
            style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', flexWrap: 'wrap' }}
          >
            {moods.map((mood, i) => (
              <motion.button
                key={mood.value}
                whileHover={{ scale: 1.15, y: -4 }}
                whileTap={{ scale: 0.9 }}
                onMouseEnter={() => setHoveredMood(mood)}
                onMouseLeave={() => setHoveredMood(null)}
                onClick={() => logMood(mood)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  padding: '12px 4px',
                  background: todayMood?.value === mood.value
                    ? `${mood.color}33`
                    : hoveredMood?.value === mood.value ? 'var(--bg-elevated)' : 'transparent',
                  border: todayMood?.value === mood.value ? `2px solid ${mood.color}` : '2px solid transparent',
                  borderRadius: '14px', cursor: 'pointer',
                  transition: 'background 0.2s, border 0.2s'
                }}
              >
                <span style={{ fontSize: '28px' }}>{mood.emoji}</span>
                <span style={{ fontSize: '11px', color: todayMood?.value === mood.value ? mood.color : 'var(--text-muted)', fontWeight: '600' }}>
                  {mood.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoodTracker;
