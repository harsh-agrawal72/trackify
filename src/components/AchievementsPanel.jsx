import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Zap, Star, Smile, Moon, Heart, Target, Calendar, Clock } from 'lucide-react';

// Achievement definitions
export const ACHIEVEMENTS = [
  { id: 'first_habit', icon: Star, label: 'First Step', desc: 'Complete your first habit', color: '#f1c40f', check: (stats, logs, habits) => logs.filter(l => l.completedAt).length >= 1 },
  { id: 'streak_3', icon: Flame, label: 'On Fire', desc: '3-day streak', color: '#e74c3c', check: (stats) => (stats.currentStreak || 0) >= 3 },
  { id: 'streak_7', icon: Flame, label: 'Week Warrior', desc: '7-day streak', color: '#FF8C42', check: (stats) => (stats.currentStreak || 0) >= 7 },
  { id: 'streak_30', icon: Flame, label: 'Iron Will', desc: '30-day streak', color: '#D84B6B', check: (stats) => (stats.currentStreak || 0) >= 30 },
  { id: 'level_5', icon: Zap, label: 'Powered Up', desc: 'Reach Level 5', color: '#8e44ad', check: (stats) => (stats.level || 1) >= 5 },
  { id: 'xp_500', icon: Trophy, label: 'XP Collector', desc: 'Earn 500 XP', color: '#2ecc71', check: (stats) => (stats.xp || 0) >= 500 },
  { id: 'habits_5', icon: Target, label: 'Habit Builder', desc: 'Create 5 habits', color: '#3498db', check: (stats, logs, habits) => habits.length >= 5 },
  { id: 'perfect_day', icon: Calendar, label: 'Perfect Day', desc: 'Complete all habits in a day', color: '#1abc9c', check: (stats) => stats.hadPerfectDay },
  { id: 'early_bird', icon: Clock, label: 'Early Bird', desc: 'Complete a morning habit', color: '#f39c12', check: (stats, logs, habits) => logs.some(l => { const h = habits.find(h => h.id === l.habitId); return h && h.timeOfDay === 'Morning' && l.completedAt; }) },
  { id: 'consistent', icon: Heart, label: 'Consistent', desc: 'Log habits 10 days total', color: '#e91e8c', check: (stats, logs) => new Set(logs.filter(l => l.completedAt).map(l => l.date)).size >= 10 },
];

const AchievementBadge = ({ achievement, unlocked }) => {
  const Icon = achievement.icon;
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
        padding: '16px 12px',
        background: unlocked ? `linear-gradient(135deg, ${achievement.color}22, ${achievement.color}11)` : 'var(--bg-elevated)',
        borderRadius: '16px',
        border: `1px solid ${unlocked ? achievement.color + '55' : 'var(--stroke-subtle)'}`,
        filter: unlocked ? 'none' : 'grayscale(1)',
        opacity: unlocked ? 1 : 0.4,
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        minWidth: '100px',
        transition: 'all 0.3s'
      }}
      title={achievement.desc}
    >
      {unlocked && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            position: 'absolute', top: '6px', right: '6px',
            width: '8px', height: '8px', borderRadius: '50%',
            background: achievement.color,
            boxShadow: `0 0 8px ${achievement.color}`
          }}
        />
      )}
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: unlocked ? `${achievement.color}33` : 'var(--bg-base)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={24} color={unlocked ? achievement.color : 'var(--text-muted)'} />
      </div>
      <div style={{ fontSize: '13px', fontWeight: '700', color: unlocked ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'center' }}>
        {achievement.label}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>
        {achievement.desc}
      </div>
    </motion.div>
  );
};

const AchievementsPanel = ({ userStats, logs, habits }) => {
  const [open, setOpen] = useState(false);
  
  const unlockedIds = ACHIEVEMENTS
    .filter(a => a.check(userStats, logs, habits))
    .map(a => a.id);
  
  const unlockedCount = unlockedIds.length;

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={() => setOpen(true)}
        style={{
          background: 'linear-gradient(135deg, rgba(241,196,15,0.15), rgba(216,75,107,0.1))',
          border: '1px solid rgba(241,196,15,0.3)',
          borderRadius: '16px', padding: '20px 24px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(241,196,15,0.2)', padding: '12px', borderRadius: '12px' }}>
            <Trophy size={28} color="#f1c40f" />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>Achievements</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {unlockedCount}/{ACHIEVEMENTS.length} badges unlocked
            </div>
          </div>
        </div>
        <div className="hide-mobile" style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
          {ACHIEVEMENTS.slice(0, 5).map(a => {
            const unlocked = unlockedIds.includes(a.id);
            const Icon = a.icon;
            return (
              <div key={a.id} style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: unlocked ? `${a.color}33` : 'var(--bg-elevated)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                filter: unlocked ? 'none' : 'grayscale(1)', opacity: unlocked ? 1 : 0.3
              }}>
                <Icon size={14} color={a.color} />
              </div>
            );
          })}
        </div>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 30 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '90%', maxWidth: '600px', background: 'var(--bg-surface)', borderRadius: '24px', padding: '32px', border: '1px solid var(--stroke-subtle)', maxHeight: '80vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                  <h2 style={{ fontSize: '28px', marginBottom: '4px' }}>🏆 Achievements</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{unlockedCount} of {ACHIEVEMENTS.length} unlocked</p>
                </div>
                <button onClick={() => setOpen(false)} style={{ background: 'var(--bg-elevated)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px 16px', borderRadius: '12px', fontSize: '15px' }}>Close</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px' }}>
                {ACHIEVEMENTS.map(a => (
                  <AchievementBadge key={a.id} achievement={a} unlocked={unlockedIds.includes(a.id)} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AchievementsPanel;
