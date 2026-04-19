import React, { useMemo, useCallback } from 'react';
import { useHabits } from '../context/HabitContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, CartesianGrid, LineChart, Line } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { Trophy, Flame, Zap, TrendingUp } from 'lucide-react';

const Analytics = () => {
  const { habits, logs, userStats, categories, focusSessions } = useHabits();

  // 1. Velocity Chart Data
  const last14Days = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = subDays(new Date(), 13 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayLogs = logs.filter(l => l.date === dateStr);
      let completed = 0;
      dayLogs.forEach(log => {
        const h = habits.find(hab => hab.id === log.habitId);
        if (!h) return;
        const isAtMost = h.goalType === 'at_most';
        const isAtMostBinary = isAtMost && h.targetUnit === 'binary';
        const isSuccessful = isAtMost 
          ? (log.completedAt && (isAtMostBinary ? log.progress === 0 : log.progress <= h.target)) 
          : (log.progress >= h.target);
        if (isSuccessful) completed++;
      });
      return { name: format(d, 'd MMM'), completed };
    });
  }, [logs, habits]);

  // 2. Heatmap Data
  const heatmapDays = useMemo(() => eachDayOfInterval({ start: subDays(new Date(), 89), end: new Date() }), []);

  const getHeatmapColor = useCallback((date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayLogs = logs.filter(l => l.date === dateStr);
    if (dayLogs.length === 0) return 'var(--bg-elevated)';
    const maxHabits = habits.length || 1;
    let completedCount = 0;
    dayLogs.forEach(log => {
      const h = habits.find(hab => hab.id === log.habitId);
      if (!h) return;
      const isAtMost = h.goalType === 'at_most';
      const isAtMostBinary = isAtMost && h.targetUnit === 'binary';
      const isSuccessful = isAtMost 
        ? (log.completedAt && (isAtMostBinary ? log.progress === 0 : log.progress <= h.target)) 
        : (log.progress >= h.target);
      if (isSuccessful) completedCount++;
    });
    const intensity = Math.min(completedCount / maxHabits, 1);
    if (intensity === 0) return 'var(--bg-elevated)';
    if (intensity < 0.4) return 'rgba(216,75,107,0.3)';
    if (intensity < 0.7) return 'rgba(216,75,107,0.6)';
    return 'var(--accent-primary)';
  }, [logs, habits]);

  // 3. Category Distribution
  const categoryData = useMemo(() => {
    const last30DaysLogs = logs.filter(l => new Date(l.date) >= subDays(new Date(), 30));
    const categoryDataRaw = {};
    last30DaysLogs.forEach(log => {
      const h = habits.find(hab => hab.id === log.habitId);
      if (!h) return;
      const isAtMost = h.goalType === 'at_most';
      const isAtMostBinary = isAtMost && h.targetUnit === 'binary';
      const isSuccessful = isAtMost 
        ? (log.completedAt && (isAtMostBinary ? log.progress === 0 : log.progress <= h.target)) 
        : (log.progress >= h.target);
      if (isSuccessful) {
        categoryDataRaw[h.categoryId] = (categoryDataRaw[h.categoryId] || 0) + 1;
      }
    });
    return Object.keys(categoryDataRaw).map(catId => {
      const cat = categories.find(c => c.id === catId);
      return { name: cat ? cat.name : 'Other', value: categoryDataRaw[catId], color: cat ? cat.color : '#8884d8' };
    });
  }, [logs, habits, categories]);

  // 4. Weekly Comparison
  const weekData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const currentDay = subDays(new Date(), 6 - i);
      const prevDay = subDays(currentDay, 7);
      const currentLogs = logs.filter(l => l.date === format(currentDay, 'yyyy-MM-dd'));
      const prevLogs = logs.filter(l => l.date === format(prevDay, 'yyyy-MM-dd'));
      let cc = 0, pc = 0;
      currentLogs.forEach(log => { 
        const h = habits.find(hab => hab.id === log.habitId); 
        if (h) { 
          const isAtMost = h.goalType === 'at_most'; 
          const isAtMostBinary = isAtMost && h.targetUnit === 'binary';
          const isSuccessful = isAtMost 
            ? (log.completedAt && (isAtMostBinary ? log.progress === 0 : log.progress <= h.target)) 
            : (log.progress >= h.target);
          if (isSuccessful) cc++; 
        } 
      });
      prevLogs.forEach(log => { 
        const h = habits.find(hab => hab.id === log.habitId); 
        if (h) { 
          const isAtMost = h.goalType === 'at_most'; 
          const isAtMostBinary = isAtMost && h.targetUnit === 'binary';
          const isSuccessful = isAtMost 
            ? (log.completedAt && (isAtMostBinary ? log.progress === 0 : log.progress <= h.target)) 
            : (log.progress >= h.target);
          if (isSuccessful) pc++; 
        } 
      });
      return { name: format(currentDay, 'EEE'), ThisWeek: cc, LastWeek: pc };
    });
  }, [logs, habits]);

  // 5. Mood History
  const moodData = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = subDays(new Date(), 13 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const moodEntry = userStats?.moodLogs?.[dateStr];
      return { name: format(d, 'd MMM'), mood: moodEntry ? moodEntry.value : null };
    }).filter(d => d.mood !== null);
  }, [userStats?.moodLogs]);

  // 6. Best Habits Leaderboard
  const habitScores = useMemo(() => {
    return habits.map(h => {
      const habitLogs = logs.filter(l => l.habitId === h.id && l.completedAt);
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const d = subDays(new Date(), i);
        if (!(h.frequencyDays || [0,1,2,3,4,5,6]).includes(d.getDay())) continue;
        const log = logs.find(l => l.habitId === h.id && l.date === format(d, 'yyyy-MM-dd'));
        const isAtMost = h.goalType === 'at_most';
        const isAtMostBinary = isAtMost && h.targetUnit === 'binary';
        const isSuccessful = isAtMost 
          ? (log && log.completedAt && (isAtMostBinary ? log.progress === 0 : log.progress <= h.target)) 
          : (log && log.progress >= h.target);
        if (isSuccessful) streak++;
        else if (i !== 0) break;
      }
      return { ...h, completions: habitLogs.length, streak };
    }).sort((a, b) => b.completions - a.completions).slice(0, 5);
  }, [habits, logs]);

  // 7. Focus Stats
  const { totalFocusMins, focusData } = useMemo(() => {
    const mins = (focusSessions || []).filter(s => s.mode === 'focus').reduce((a, b) => a + (b.duration || 0), 0);
    const data = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayMins = (focusSessions || []).filter(s => s.date === dateStr && s.mode === 'focus').reduce((a, b) => a + (b.duration || 0), 0);
      return { name: format(d, 'EEE'), minutes: dayMins };
    });
    return { totalFocusMins: mins, focusData: data };
  }, [focusSessions]);

  const panelStyle = useMemo(() => ({ background: 'var(--bg-surface)', border: '1px solid var(--stroke-subtle)', borderRadius: '20px', padding: '28px' }), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '38px', fontWeight: '800', marginBottom: '8px' }}>Advanced Analytics</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track your 90-day trajectory, velocity, mood, and focus.</p>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
        {[
          { label: 'Total XP Earned', val: userStats.xp || 0, color: 'var(--accent-warning)', Icon: Zap },
          { label: 'Active Habits', val: habits.filter(h => h.status === 'active').length, color: 'var(--accent-primary)', Icon: TrendingUp },
          { label: 'Highest Streak', val: userStats.highestStreak || userStats.currentStreak || 0, color: 'var(--accent-success)', Icon: Flame },
          { label: 'Total Completions', val: logs.filter(l => l.completedAt).length, color: '#8e44ad', Icon: Trophy },
          { label: 'Focus Minutes', val: totalFocusMins, color: '#3498db', Icon: Zap },
        ].map(({ label, val, color, Icon }) => (
          <div key={label} style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</div>
              <Icon size={16} color={color} />
            </div>
            <div style={{ fontSize: '38px', fontWeight: '900', color, letterSpacing: '-1px', lineHeight: 1 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div style={panelStyle}>
        <h3 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '700' }}>90-Day Activity Heatmap</h3>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '100%', overflowX: 'auto', paddingBottom: '8px' }}>
          {heatmapDays.map((day, i) => (
            <div
              key={i}
              title={`${format(day, 'MMM do')}`}
              style={{
                width: '14px', height: '14px', borderRadius: '4px',
                background: getHeatmapColor(day),
                border: '1px solid var(--stroke-subtle)',
                transition: 'transform 0.1s, box-shadow 0.1s',
                cursor: 'default'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.4)'; e.currentTarget.style.boxShadow = '0 0 6px var(--accent-primary)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>Less</span>
          {['var(--bg-elevated)', 'rgba(216,75,107,0.3)', 'rgba(216,75,107,0.6)', 'var(--accent-primary)'].map((bg, i) => (
            <div key={i} style={{ width: '12px', height: '12px', borderRadius: '3px', background: bg }} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>

        {/* 14-Day Velocity */}
        <div style={panelStyle}>
          <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '700' }}>14-Day Velocity</h3>
          <div style={{ width: '100%', height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last14Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--stroke-subtle)', borderRadius: '10px', color: 'var(--text-primary)' }} />
                <Area type="monotone" dataKey="completed" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" dot={{ fill: 'var(--accent-primary)', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div style={panelStyle}>
          <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '700' }}>Category Distribution (30 Days)</h3>
          <div style={{ width: '100%', height: '250px' }}>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--stroke-subtle)', borderRadius: '10px', color: 'var(--text-primary)' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Complete habits to see category distribution
              </div>
            )}
          </div>
        </div>

        {/* Mood History */}
        <div style={panelStyle}>
          <h3 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: '700' }}>Mood Trend (14 Days)</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>1=Rough, 5=Amazing</p>
          <div style={{ width: '100%', height: '220px' }}>
            {moodData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} stroke="var(--text-muted)" tick={{ fill: 'var(--text-secondary)' }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--stroke-subtle)', borderRadius: '10px', color: '#FFF' }}
                    formatter={(val) => [['😞','😕','😐','😊','🤩'][val-1] + ` (${val})`, 'Mood']}
                  />
                  <Line type="monotone" dataKey="mood" stroke="var(--accent-success)" strokeWidth={3} dot={{ fill: 'var(--accent-success)', r: 5 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Log your mood daily from the Dashboard to see trends.
              </div>
            )}
          </div>
        </div>

        {/* Focus Minutes */}
        <div style={panelStyle}>
          <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '700' }}>Daily Focus Minutes (7 Days)</h3>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={focusData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke-subtle)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-secondary)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--stroke-subtle)', borderRadius: '10px', color: 'var(--text-primary)' }} />
                <Bar dataKey="minutes" name="Focus Mins" fill="#3498db" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Comparison - full width */}
        <div style={{ ...panelStyle, gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '700' }}>Weekly Progress Comparison</h3>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke-subtle)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--stroke-subtle)', borderRadius: '10px', color: 'var(--text-primary)' }} />
                <Legend />
                <Bar dataKey="ThisWeek" name="This Week" fill="var(--accent-primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="LastWeek" name="Last Week" fill="var(--text-muted)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Best Habits Leaderboard */}
      {habitScores.length > 0 && (
        <div style={panelStyle}>
          <h3 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '700' }}>🏆 Habit Leaderboard</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {habitScores.map((h, i) => {
              const cat = categories.find(c => c.id === h.categoryId);
              const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
              return (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: i === 0 ? 'linear-gradient(135deg, rgba(241,196,15,0.15), rgba(241,196,15,0.05))' : 'var(--bg-elevated)', borderRadius: '14px', border: i === 0 ? '1px solid rgba(241,196,15,0.3)' : '1px solid transparent' }}>
                  <span style={{ fontSize: '24px', width: '32px', textAlign: 'center' }}>{medals[i]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '15px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{h.name}</div>
                    <div style={{ fontSize: '11px', color: cat?.color || 'var(--text-muted)', fontWeight: '500' }}>
                      {cat?.name || 'Habit'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', textAlign: 'right', flexShrink: 0 }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-primary)' }}>{h.completions}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Done</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-warning)' }}>{h.streak}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Streak</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
