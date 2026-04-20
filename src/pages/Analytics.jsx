import React, { useMemo, useCallback, memo } from 'react';
import { useHabitData, useHabitActions } from '../context/HabitContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, CartesianGrid, LineChart, Line } from 'recharts';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { Trophy, Flame, Zap, TrendingUp } from 'lucide-react';

const Analytics = () => {
  const { habits, logs, userStats, categories, focusSessions } = useHabitData();

  // Helper for determining success on a specific date log
  const isLogSuccessful = useCallback((log, h) => {
    if (!log || !h) return false;
    const isAtMost = h.goalType === 'at_most';
    const isAtMostBinary = isAtMost && h.targetUnit === 'binary';
    return isAtMost 
      ? (log.completedAt && (isAtMostBinary ? log.progress === 0 : log.progress <= h.target)) 
      : (log.progress >= h.target);
  }, []);

  // 1. Velocity Chart Data (Last 14 Days)
  const last14Days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }).map((_, i) => {
      const d = subDays(today, 13 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayLogs = logs.filter(l => l.date === dateStr);
      let completed = 0;
      dayLogs.forEach(log => {
        const h = habits.find(hab => hab.id === log.habitId);
        if (isLogSuccessful(log, h)) completed++;
      });
      return { name: format(d, 'd MMM'), completed };
    });
  }, [logs, habits, isLogSuccessful]);

  // 2. Heatmap Data (Last 90 Days)
  const { heatmapData, heatmapDays } = useMemo(() => {
    const today = new Date();
    const days = eachDayOfInterval({ start: subDays(today, 89), end: today });
    const data = days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayLogs = logs.filter(l => l.date === dateStr);
      const maxHabits = habits.length || 1;
      let completedCount = 0;
      dayLogs.forEach(log => {
        const h = habits.find(hab => hab.id === log.habitId);
        if (isLogSuccessful(log, h)) completedCount++;
      });
      
      const intensity = Math.min(completedCount / maxHabits, 1);
      let color = 'var(--bg-elevated)';
      if (intensity > 0) {
        if (intensity < 0.4) color = 'rgba(216,75,107,0.3)';
        else if (intensity < 0.7) color = 'rgba(216,75,107,0.6)';
        else color = 'var(--accent-primary)';
      }
      
      return { date: day, dateStr, color };
    });
    return { heatmapData: data, heatmapDays: days };
  }, [logs, habits, isLogSuccessful]);

  // 3. Category Distribution (Last 30 Days)
  const categoryData = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentLogs = logs.filter(l => new Date(l.date) >= thirtyDaysAgo);
    const counts = {};
    recentLogs.forEach(log => {
      const h = habits.find(hab => hab.id === log.habitId);
      if (isLogSuccessful(log, h)) {
        counts[h.categoryId] = (counts[h.categoryId] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([catId, val]) => {
      const cat = categories.find(c => c.id === catId);
      return { name: cat ? cat.name : 'Other', value: val, color: cat ? cat.color : '#8884d8' };
    });
  }, [logs, habits, categories, isLogSuccessful]);

  // 4. Weekly Comparison
  const weekData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const currentDay = subDays(today, 6 - i);
      const prevDay = subDays(currentDay, 7);
      const currentStr = format(currentDay, 'yyyy-MM-dd');
      const prevStr = format(prevDay, 'yyyy-MM-dd');
      
      const getCount = (str) => {
        let count = 0;
        logs.filter(l => l.date === str).forEach(log => {
          if (isLogSuccessful(log, habits.find(h => h.id === log.habitId))) count++;
        });
        return count;
      };

      return { name: format(currentDay, 'EEE'), ThisWeek: getCount(currentStr), LastWeek: getCount(prevStr) };
    });
  }, [logs, habits, isLogSuccessful]);

  // 5. Mood History
  const moodData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }).map((_, i) => {
      const d = subDays(today, 13 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const moodEntry = userStats?.moodLogs?.[dateStr];
      return { name: format(d, 'd MMM'), mood: moodEntry ? moodEntry.value : null };
    }).filter(d => d.mood !== null);
  }, [userStats?.moodLogs]);

  // 6. Best Habits Leaderboard
  const habitScores = useMemo(() => {
    const today = new Date();
    return habits.map(h => {
      const habitLogs = logs.filter(l => l.habitId === h.id && !!l.completedAt);
      let currentStreak = 0;
      for (let i = 0; i < 30; i++) { // Check last 30 days for streak
        const d = subDays(today, i);
        if (!(h.frequencyDays || [0,1,2,3,4,5,6]).includes(d.getDay())) continue;
        const log = logs.find(l => l.habitId === h.id && l.date === format(d, 'yyyy-MM-dd'));
        if (isLogSuccessful(log, h)) currentStreak++;
        else if (i !== 0) break;
      }
      return { ...h, completions: habitLogs.length, streak: currentStreak };
    }).sort((a, b) => b.completions - a.completions).slice(0, 5);
  }, [habits, logs, isLogSuccessful]);

  // 7. Focus Stats
  const { totalFocusMins, focusData } = useMemo(() => {
    const today = new Date();
    const mins = (focusSessions || []).filter(s => s.mode === 'focus').reduce((a, s) => a + (s.duration || 0), 0);
    const data = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(today, 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayMins = (focusSessions || []).filter(s => s.date === dateStr && s.mode === 'focus').reduce((a, s) => a + (s.duration || 0), 0);
      return { name: format(d, 'EEE'), minutes: dayMins };
    });
    return { totalFocusMins: mins, focusData: data };
  }, [focusSessions]);

  const panelStyle = { background: 'var(--bg-surface)', border: '1px solid var(--stroke-subtle)', borderRadius: '20px', padding: '24px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: '800', marginBottom: '8px' }}>Analytics</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Your progress and patterns over time.</p>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total XP', val: userStats.xp || 0, color: 'var(--accent-warning)', Icon: Zap },
          { label: 'Current Streak', val: userStats.currentStreak || 0, color: 'var(--accent-primary)', Icon: Flame },
          { label: 'Total Done', val: logs.filter(l => !!l.completedAt).length, color: '#8e44ad', Icon: Trophy },
          { label: 'Focus Mins', val: totalFocusMins, color: '#3498db', Icon: TrendingUp },
        ].map(({ label, val, color, Icon }) => (
          <div key={label} style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>{label}</span>
              <Icon size={14} color={color} />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div style={panelStyle}>
        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '700' }}>Last 90 Days Activity</h3>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', overflowX: 'auto', paddingBottom: '8px' }}>
          {heatmapData.map((day, i) => (
            <div
              key={i}
              title={day.dateStr}
              style={{
                width: '12px', height: '12px', borderRadius: '3px',
                background: day.color, border: '1px solid rgba(0,0,0,0.1)'
              }}
            />
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(Min(400px, 100%), 1fr))', gap: '20px' }}>
        
        {/* Velocity */}
        <div style={panelStyle}>
          <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>14-Day Velocity</h3>
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last14Days} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--text-muted)" allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: 'none', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="completed" stroke="var(--accent-primary)" fill="url(#colorPrimary)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories */}
        <div style={panelStyle}>
          <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Category Focus (30d)</h3>
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Comparison */}
        <div style={{ ...panelStyle, gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Current vs Previous Week</h3>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--stroke-subtle)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="ThisWeek" name="This Week" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="LastWeek" name="Last Week" fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      {habitScores.length > 0 && (
        <div style={panelStyle}>
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '700' }}>Top Habits</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {habitScores.map((h, i) => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '12px' }}>
                <div style={{ width: '24px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)' }}>{i+1}</div>
                <div style={{ flex: 1, fontWeight: '700' }}>{h.name}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-primary)' }}>{h.completions} checks</div>
                  <div style={{ fontSize: '11px', color: 'var(--accent-warning)' }}>{h.streak}d streak</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;

