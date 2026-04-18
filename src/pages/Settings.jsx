import React, { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { User, Volume2, ShieldAlert, Check, Download, Palette, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const ACCENT_COLORS = [
  { name: 'Rose',    value: '#D84B6B' },
  { name: 'Purple',  value: '#8e44ad' },
  { name: 'Blue',    value: '#3498db' },
  { name: 'Teal',    value: '#1abc9c' },
  { name: 'Orange',  value: '#e67e22' },
  { name: 'Coral',   value: '#FF6B6B' },
  { name: 'Lime',    value: '#27ae60' },
  { name: 'Gold',    value: '#f39c12' },
];

const Settings = () => {
  const { userStats, updatePreferences, resetData } = useHabits();
  const [name, setName] = useState(userStats.preferences?.name || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveProfile = () => {
    updatePreferences({ name });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const toggleSound = () => updatePreferences({ sound: !userStats.preferences?.sound });

  const handleReset = () => {
    if (window.confirm("Are you sure you want to delete all habits, tasks, and history? This cannot be undone.")) {
      resetData();
    }
  };

  const currentAccent = userStats.preferences?.accentColor || '#D84B6B';

  const sectionStyle = { background: 'var(--bg-surface)', border: '1px solid var(--stroke-subtle)', borderRadius: '20px', padding: '32px' };
  const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '840px' }}>

      <div>
        <h1 style={{ fontSize: '38px', fontWeight: '800', marginBottom: '8px' }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Customize your Trackify experience.</p>
      </div>

      {/* Profile */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <User color="var(--accent-primary)" /> Profile
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500' }}>Display Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" />
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="btn btn-primary"
              onClick={handleSaveProfile}
              style={{ width: '140px', background: isSaved ? 'var(--accent-success)' : 'var(--accent-primary)' }}
            >
              {isSaved ? <><Check size={18} /> Saved!</> : 'Save Profile'}
            </motion.button>
          </div>

          {/* Level & XP Display */}
          <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(216,75,107,0.1), rgba(142,68,173,0.08))', borderRadius: '16px', border: '1px solid rgba(216,75,107,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '18px' }}>Level {userStats.level || 1}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{userStats.xp || 0} XP total</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Next level</div>
                <div style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{((userStats.level || 1) * 1000) - (userStats.xp || 0)} XP away</div>
              </div>
            </div>
            <div style={{ height: '8px', background: 'var(--bg-elevated)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((userStats.xp || 0) % 1000) / 10}%`, background: 'linear-gradient(90deg, var(--accent-primary), #8e44ad)', borderRadius: '99px', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Theme Customizer */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Palette color="var(--accent-primary)" /> Theme Color
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>Choose your accent color — it will be applied throughout the app.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {ACCENT_COLORS.map(color => (
            <motion.button
              key={color.value}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => updatePreferences({ accentColor: color.value })}
              title={color.name}
              style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: color.value,
                border: currentAccent === color.value ? '3px solid white' : '3px solid transparent',
                cursor: 'pointer',
                boxShadow: currentAccent === color.value ? `0 0 0 3px ${color.value}, 0 4px 16px ${color.value}66` : `0 4px 12px ${color.value}44`,
                position: 'relative'
              }}
            >
              {currentAccent === color.value && (
                <Check size={20} color="#fff" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
              )}
            </motion.button>
          ))}
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px' }}>Current: <strong style={{ color: currentAccent }}>{ACCENT_COLORS.find(c => c.value === currentAccent)?.name || 'Custom'}</strong></p>
      </div>

      {/* Preferences */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Volume2 color="var(--accent-warning)" /> Preferences
        </h2>
        <div style={rowStyle}>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Sound Effects</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Play audio cues when completing habits or focus sessions.</div>
          </div>
          <button
            onClick={toggleSound}
            style={{
              width: '52px', height: '28px', borderRadius: '14px',
              background: userStats.preferences?.sound ? 'var(--accent-success)' : 'var(--bg-base)',
              position: 'relative', border: '1px solid var(--stroke-subtle)', cursor: 'pointer', transition: 'background 0.3s',
              flexShrink: 0
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '11px', background: '#FFF',
              position: 'absolute', top: '2px', left: userStats.preferences?.sound ? '27px' : '2px', transition: 'left 0.3s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Download color="var(--accent-primary)" /> Data Management
        </h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={rowStyle}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Export Backup</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Save all your habits, tasks, and history to a JSON file.</div>
            </div>
            <button
              onClick={() => {
                const data = {
                  habits: JSON.parse(localStorage.getItem('trackify_habits') || '[]'),
                  logs: JSON.parse(localStorage.getItem('trackify_logs') || '[]'),
                  tasks: JSON.parse(localStorage.getItem('trackify_tasks') || '[]'),
                  categories: JSON.parse(localStorage.getItem('trackify_categories') || '[]'),
                  userStats: JSON.parse(localStorage.getItem('trackify_stats') || '{}')
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `trackify-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="btn"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--stroke-subtle)', color: 'var(--text-primary)', flexShrink: 0 }}
            >
              Export
            </button>
          </div>

          <div style={rowStyle}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Import Backup</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Restore your data from a previous JSON backup file.</div>
            </div>
            <div>
              <input type="file" id="import-backup" accept=".json" style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const data = JSON.parse(event.target.result);
                      if (data.habits) localStorage.setItem('trackify_habits', JSON.stringify(data.habits));
                      if (data.logs) localStorage.setItem('trackify_logs', JSON.stringify(data.logs));
                      if (data.tasks) localStorage.setItem('trackify_tasks', JSON.stringify(data.tasks));
                      if (data.categories) localStorage.setItem('trackify_categories', JSON.stringify(data.categories));
                      if (data.userStats) localStorage.setItem('trackify_stats', JSON.stringify(data.userStats));
                      alert('Data imported successfully. The app will now reload.');
                      window.location.reload();
                    } catch (err) { alert('Failed to parse backup file.'); }
                  };
                  reader.readAsText(file);
                }}
              />
              <label htmlFor="import-backup" className="btn" style={{ display: 'inline-block', cursor: 'pointer', background: 'var(--bg-base)', border: '1px solid var(--stroke-subtle)', color: 'var(--text-primary)' }}>
                Import
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ ...sectionStyle, border: '1px solid rgba(231,76,60,0.3)' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-danger)' }}>
          <ShieldAlert color="var(--accent-danger)" /> Danger Zone
        </h2>
        <div style={{ ...rowStyle, background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231, 76, 60, 0.2)' }}>
          <div>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Wipe All Data</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Permanently delete all habits, tasks, logs, and XP.</div>
          </div>
          <button onClick={handleReset} className="btn" style={{ background: 'var(--accent-danger)', color: '#FFF', flexShrink: 0 }}>
            Factory Reset
          </button>
        </div>
      </div>

    </div>
  );
};

export default Settings;
