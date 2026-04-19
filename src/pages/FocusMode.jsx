import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Brain, Coffee, Zap, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { showXPToast } from '../components/XPToast';

const FocusMode = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('focus');
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [customName, setCustomName] = useState('');
  const { focusSessions, addFocusSession, userStats, clearFocusSessions } = useHabits();

  // History Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 6;

  // Stopwatch States
  const [activeTab, setActiveTab] = useState('timer'); // 'timer' | 'stopwatch'
  const [swStartTime, setSwStartTime] = useState(() => {
    const saved = localStorage.getItem('habbitz_stopwatch_start');
    return saved ? parseInt(saved) : null;
  });
  const [swElapsed, setSwElapsed] = useState(0);
  const [swIsActive, setSwIsActive] = useState(!!swStartTime);
  const [swName, setSwName] = useState(localStorage.getItem('habbitz_stopwatch_name') || '');

  const modeConfig = {
    focus: { color: 'var(--accent-primary)', label: 'Pomodoro', time: 25 * 60, icon: Brain, xp: 30 },
    shortBreak: { color: 'var(--accent-success)', label: 'Short Break', time: 5 * 60, icon: Coffee, xp: 5 },
    longBreak: { color: '#3498db', label: 'Long Break', time: 15 * 60, icon: Zap, xp: 10 },
    custom: { color: 'var(--cat-yellow)', label: 'Custom', time: totalTime, icon: Clock, xp: 20 },
  };

  const currentModeConfig = modeConfig[mode];

  const handleSessionComplete = () => {
    setCompletedSessions(c => c + 1);
    const sessionData = {
      mode,
      duration: Math.floor(modeConfig[mode].time / 60),
      date: format(new Date(), 'yyyy-MM-dd'),
      label: mode === 'custom' && customName ? customName : modeConfig[mode].label,
    };
    addFocusSession(sessionData);
    showXPToast(`${modeConfig[mode].label} complete!`, modeConfig[mode].xp, 'streak');
    // Play notification
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } catch(e) {}
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(modeConfig[mode].time);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    const t = modeConfig[newMode].time;
    setTotalTime(t);
    setTimeLeft(t);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const endTimeRef = useRef(null);
  const onCompleteRef = useRef(null);

  // Keep handleSessionComplete ref up to date
  useEffect(() => {
    onCompleteRef.current = handleSessionComplete;
  }, [handleSessionComplete]);

  useEffect(() => {
    let interval = null;

    const tick = () => {
      if (!endTimeRef.current) return;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setIsActive(false);
        endTimeRef.current = null;
        if (onCompleteRef.current) onCompleteRef.current();
      }
    };

    if (isActive && timeLeft > 0) {
      // Set the target end time when starting/resuming
      endTimeRef.current = Date.now() + timeLeft * 1000;
      
      interval = setInterval(tick, 1000);

      // Instantly sync when the tab becomes visible
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          tick();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      endTimeRef.current = null;
      if (interval) clearInterval(interval);
    }
  }, [isActive]);


  // --- Stopwatch Logic ---
  useEffect(() => {
    let swInterval = null;
    const updateSw = () => {
      if (swStartTime) {
        setSwElapsed(Math.floor((Date.now() - swStartTime) / 1000));
      }
    };

    if (swIsActive && swStartTime) {
      updateSw();
      swInterval = setInterval(updateSw, 1000);
    } else {
      if (swInterval) clearInterval(swInterval);
    }
    return () => clearInterval(swInterval);
  }, [swIsActive, swStartTime]);

  useEffect(() => {
    if (swStartTime) localStorage.setItem('habbitz_stopwatch_start', swStartTime.toString());
    else localStorage.removeItem('habbitz_stopwatch_start');
    
    if (swName) localStorage.setItem('habbitz_stopwatch_name', swName);
    else localStorage.removeItem('habbitz_stopwatch_name');
  }, [swStartTime, swName]);

  const toggleStopwatch = () => {
    if (swIsActive) {
      setSwIsActive(false);
      // We don't clear swStartTime here to allow "pausing" if we wanted, 
      // but for absolute persistence of a "running" stopwatch, we usually just want it to keep going.
      // However, the user said "webapp band karne par bhi nahi rukni chahiye", which implies we just need swStartTime.
      setSwIsActive(false);
    } else {
      if (!swStartTime) setSwStartTime(Date.now());
      setSwIsActive(true);
    }
  };

  const resetStopwatch = () => {
    setSwIsActive(false);
    setSwStartTime(null);
    setSwElapsed(0);
    localStorage.removeItem('habbitz_stopwatch_start');
  };

  const finishStopwatch = () => {
    if (swElapsed <= 0) return;
    const sessionData = {
      mode: 'stopwatch',
      duration: Math.max(1, Math.ceil(swElapsed / 60)),
      date: format(new Date(), 'yyyy-MM-dd'),
      label: swName || 'Stopwatch Session',
    };
    addFocusSession(sessionData);
    showXPToast("Session saved!", 20, 'streak'); // 20 XP for stopwatch
    setCompletedSessions(c => c + 1);
    resetStopwatch();
  };


  const progressPct = 1 - timeLeft / Math.max(1, modeConfig[mode].time);
  const circumference = 2 * Math.PI * 130;
  const todaySessions = focusSessions.filter(s => s.date === format(new Date(), 'yyyy-MM-dd'));
  const totalFocusMinutes = focusSessions.filter(s => s.mode === 'focus').reduce((a, b) => a + (b.duration || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 'min(36px, 8vw)', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Brain color={currentModeConfig.color} /> Focus Session
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Deep work builds extraordinary habits.</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--stroke-subtle)', borderRadius: '12px', padding: '10px 18px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
        >
          <TrendingUp size={16} /> Stats
        </button>
      </div>

      {/* Stats Strip */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--stroke-subtle)', borderRadius: '16px', padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: currentModeConfig.color }}>{completedSessions}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Session</div>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--stroke-subtle)', borderRadius: '16px', padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-success)' }}>{todaySessions.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Today</div>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--stroke-subtle)', borderRadius: '16px', padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-warning)' }}>{totalFocusMinutes}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mins</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Main Panel */}
        <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '300px' }}>
          
          {/* Main Switcher */}
          <div style={{ display: 'flex', width: '100%', maxWidth: '300px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '14px', marginBottom: '32px' }}>
            <button 
              onClick={() => setActiveTab('timer')}
              style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '12px', background: activeTab === 'timer' ? 'var(--bg-surface)' : 'transparent', color: activeTab === 'timer' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Timer
            </button>
            <button 
              onClick={() => setActiveTab('stopwatch')}
              style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '12px', background: activeTab === 'stopwatch' ? 'var(--bg-surface)' : 'transparent', color: activeTab === 'stopwatch' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Stopwatch
            </button>
          </div>

          {activeTab === 'timer' ? (
            <>
              {/* Mode Selector */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', background: 'var(--bg-elevated)', padding: '8px', borderRadius: '24px', marginBottom: '36px', width: '100%' }}>
                {Object.entries(modeConfig).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => switchMode(key)}
                    style={{
                      padding: '8px 16px', fontSize: '13px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                      background: mode === key ? 'var(--bg-surface)' : 'transparent',
                      color: mode === key ? cfg.color : 'var(--text-secondary)',
                      fontWeight: mode === key ? 'bold' : 'normal',
                      transition: 'all 0.2s', boxShadow: mode === key ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                    }}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              {mode === 'custom' && !isActive && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px', width: '100%', maxWidth: '320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: '16px' }}>
                    <input
                      type="number" min="1" max="999"
                      value={Math.floor(totalTime / 60)}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setTotalTime(val * 60);
                        setTimeLeft(val * 60);
                      }}
                      style={{ width: '60px', textAlign: 'center', fontSize: '18px', padding: '4px', background: 'transparent', border: 'none', borderBottom: '2px solid var(--cat-yellow)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Minutes</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: '16px' }}>
                    <input
                      type="text"
                      placeholder="Session Name (e.g. Reading)"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '14px' }}
                    />
                  </div>
                </div>
              )}

              {/* Timer Display */}
              <div style={{ position: 'relative', width: '280px', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' }}>
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="140" cy="140" r="130" stroke="var(--bg-elevated)" strokeWidth="8" fill="none" />
                  <circle
                    cx="140" cy="140" r="130"
                    stroke={currentModeConfig.color} strokeWidth="8" fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progressPct)}
                    style={{ transition: 'stroke-dashoffset 1s linear', strokeLinecap: 'round' }}
                  />
                </svg>
                <div style={{ textAlign: 'center', zIndex: 1 }}>
                  <div style={{ fontSize: '72px', fontWeight: '800', fontFamily: 'monospace', color: currentModeConfig.color, letterSpacing: '-2px', lineHeight: 1 }}>
                    {formatTime(timeLeft)}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {currentModeConfig.label}
                  </div>
                  {isActive && (
                    <motion.div
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ marginTop: '8px', fontSize: '12px', color: currentModeConfig.color }}
                    >
                      ● LIVE
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTimer}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    width: '180px', height: '56px', fontSize: '17px', fontWeight: '700', border: 'none', cursor: 'pointer', borderRadius: '18px',
                    color: isActive ? 'var(--text-primary)' : '#FFF',
                    background: isActive ? 'var(--bg-elevated)' : currentModeConfig.color,
                    boxShadow: isActive ? 'none' : `0 8px 24px -8px ${currentModeConfig.color}`,
                  }}
                >
                  {isActive ? <Pause size={22} /> : <Play size={22} fill="currentColor" />}
                  {isActive ? 'Pause' : 'Start'}
                </motion.button>

                <motion.button
                  whileHover={{ rotate: -20 }}
                  onClick={resetTimer}
                  style={{
                    width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--bg-elevated)', border: '1px solid var(--stroke-subtle)', cursor: 'pointer', color: 'var(--text-secondary)',
                  }}
                >
                  <RotateCcw size={22} />
                </motion.button>
              </div>
            </>
          ) : (
            <>
              {/* Stopwatch View */}
              <div style={{ width: '100%', maxWidth: '320px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: '16px' }}>
                  <input
                    type="text"
                    placeholder="Session Name (e.g. Working)"
                    value={swName}
                    onChange={(e) => setSwName(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '14px' }}
                  />
                </div>
              </div>

              {/* Stopwatch Display */}
              <div style={{ position: 'relative', width: '280px', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' }}>
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="140" cy="140" r="130" stroke="var(--bg-elevated)" strokeWidth="8" fill="none" />
                  {swIsActive && (
                    <circle
                      cx="140" cy="140" r="130"
                      stroke="var(--accent-primary)" strokeWidth="8" fill="none"
                      strokeDasharray="10 20"
                      style={{ animation: 'dashArray 20s linear infinite' }}
                    />
                  )}
                </svg>
                <div style={{ textAlign: 'center', zIndex: 1 }}>
                  <div style={{ fontSize: '64px', fontWeight: '800', fontFamily: 'monospace', color: 'var(--accent-primary)', letterSpacing: '-1px', lineHeight: 1 }}>
                    {formatTime(swElapsed)}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Stopwatch
                  </div>
                  {swIsActive && (
                    <motion.div
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{ marginTop: '8px', fontSize: '12px', color: 'var(--accent-primary)' }}
                    >
                      ● RUNNING
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Stopwatch Controls */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleStopwatch}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    width: '140px', height: '56px', fontSize: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', borderRadius: '18px',
                    color: swIsActive ? 'var(--text-primary)' : '#FFF',
                    background: swIsActive ? 'var(--bg-elevated)' : 'var(--accent-primary)',
                    boxShadow: swIsActive ? 'none' : `0 8px 24px -8px var(--accent-primary)`,
                  }}
                >
                  {swIsActive ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
                  {swIsActive ? 'Pause' : (swStartTime ? 'Resume' : 'Start')}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={finishStopwatch}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    width: '120px', height: '56px', fontSize: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', borderRadius: '18px',
                    background: 'var(--accent-success)', color: '#FFF', 
                    boxShadow: '0 8px 24px -8px var(--accent-success)',
                  }}
                >
                  <CheckCircle2 size={20} />
                  Finish
                </motion.button>

                <motion.button
                  whileHover={{ rotate: -20 }}
                  onClick={resetStopwatch}
                  style={{
                    width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--bg-elevated)', border: '1px solid var(--stroke-subtle)', cursor: 'pointer', color: 'var(--text-secondary)',
                  }}
                >
                  <RotateCcw size={20} />
                </motion.button>
              </div>
            </>
          )}

          {/* Session dots */}
          {completedSessions > 0 && (
            <div style={{ marginTop: '24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sessions:</span>
              {Array.from({ length: Math.min(completedSessions, 10) }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-primary)' }}
                />
              ))}
              {completedSessions > 10 && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>+{completedSessions - 10}</span>}
            </div>
          )}
        </div>

        {/* Session History Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel"
              style={{ padding: '24px', flex: '1 1 300px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Session History</h3>
                {focusSessions.length > 0 && (
                  <button 
                    onClick={() => {
                      if (window.confirm('Clear all focus session history?')) {
                        clearFocusSessions();
                        setCurrentPage(1);
                      }
                    }}
                    style={{ background: 'transparent', border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {focusSessions.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', gap: '12px' }}>
                  <Clock size={48} opacity={0.2} />
                  <p style={{ fontSize: '14px' }}>No sessions yet. Start your first focus session!</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    {focusSessions.slice((currentPage - 1) * sessionsPerPage, currentPage * sessionsPerPage).map((session, i) => (
                      <div key={session.id || i} style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600' }}>{session.label}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{session.date}</div>
                        </div>
                        <div style={{ fontSize: '14px', color: modeConfig[session.mode]?.color || 'var(--accent-primary)', fontWeight: '700' }}>
                          {session.duration}m
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {focusSessions.length > sessionsPerPage && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '12px 0', borderTop: '1px solid var(--stroke-subtle)' }}>
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--stroke-subtle)', background: 'var(--bg-elevated)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage === 1 ? 'default' : 'pointer', fontSize: '13px' }}
                      >
                        Prev
                      </button>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Page {currentPage} of {Math.ceil(focusSessions.length / sessionsPerPage)}
                      </span>
                      <button
                        disabled={currentPage === Math.ceil(focusSessions.length / sessionsPerPage)}
                        onClick={() => setCurrentPage(p => p + 1)}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--stroke-subtle)', background: 'var(--bg-elevated)', color: currentPage === Math.ceil(focusSessions.length / sessionsPerPage) ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage === Math.ceil(focusSessions.length / sessionsPerPage) ? 'default' : 'pointer', fontSize: '13px' }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FocusMode;
