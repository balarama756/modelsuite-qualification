import { useEffect, useState, useMemo } from 'react';
import TalentSidebar from '../../components/talent/TalentSidebar';
import AvailableTasksList from '../../components/talent/AvailableTasksList';
import MyTasksList from '../../components/talent/MyTasksList';
import { fetchAvailableTasks, fetchMyTasks } from '../../api/talent';
import { useAuth } from '../../context/AuthContext';

/* ── SVG Circular Progress Ring ── */
const ProgressRing = ({ radius = 26, stroke = 4, progress = 0, color = '#3B82F6' }) => {
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={radius * 2} height={radius * 2}>
      {/* Background track */}
      <circle
        cx={radius} cy={radius} r={normalizedRadius}
        fill="none"
        stroke="var(--theme-border)"
        strokeWidth={stroke}
      />
      {/* Progress arc */}
      <circle
        cx={radius} cy={radius} r={normalizedRadius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="progress-ring-circle"
        style={{
          transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </svg>
  );
};

/* ── Greeting helper based on time of day ── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* ── Format current date ── */
const formatDate = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

/* ── Summary pill items ── */
const SUMMARY_ITEMS = [
  { key: 'Claimed',   label: 'In Progress', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)' },
  { key: 'Submitted', label: 'Under Review', color: '#60A5FA', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)' },
  { key: 'Approved',  label: 'Completed',    color: '#34D399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)' },
  { key: 'Rejected',  label: 'Rejected',     color: '#F87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)' },
];

const TalentDashboard = () => {
  const { user } = useAuth();
  const [availableTasks, setAvailableTasks] = useState([]);
  const [myTasks, setMyTasks]               = useState([]);
  const [error, setError] = useState(null);

  const loadAvailable = async () => {
    try { const { data } = await fetchAvailableTasks(); setAvailableTasks(data); }
    catch { setError('Failed to load available tasks'); }
  };

  const loadMyTasks = async () => {
    try { const { data } = await fetchMyTasks(); setMyTasks(data); }
    catch { setError('Failed to load your tasks'); }
  };

  // eslint-disable-next-line
  useEffect(() => { loadAvailable(); loadMyTasks(); }, []);
  const handleRefresh = () => { loadAvailable(); loadMyTasks(); };

  /* ── Compute stats from myTasks ── */
  const stats = useMemo(() => {
    const total     = myTasks.length;
    const active    = myTasks.filter(t => t.status === 'Claimed').length;
    const submitted = myTasks.filter(t => t.status === 'Submitted').length;
    const approved  = myTasks.filter(t => t.status === 'Approved').length;
    const rejected  = myTasks.filter(t => t.status === 'Rejected').length;
    const completed = approved;
    const rate      = total > 0 ? Math.round((approved / total) * 100) : 0;
    const activeProgress = total > 0 ? Math.round((active / total) * 100) : 0;
    const completedProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, active, submitted, approved, rejected, completed, rate, activeProgress, completedProgress };
  }, [myTasks]);

  /* ── Status counts for summary bar ── */
  const statusCounts = useMemo(() => {
    const counts = {};
    SUMMARY_ITEMS.forEach(item => {
      counts[item.key] = myTasks.filter(t => t.status === item.key).length;
    });
    return counts;
  }, [myTasks]);

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--theme-bg)', transition: 'background 0.35s ease' }}>
      <TalentSidebar />

      <main className="ml-[220px] flex-1 px-8 py-8" style={{ maxWidth: 'calc(100vw - 220px)' }}>

        {/* ══════════════ HERO COMMAND CENTER ══════════════ */}
        <div className="hero-section page-section mb-7">
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Greeting */}
            <h1 className="hero-greeting">
              {getGreeting()}, {firstName}
            </h1>
            <p className="hero-subtitle">
              Here&apos;s your command center — track progress and stay on top of your tasks.
            </p>
            <p className="hero-date">{formatDate()}</p>

            {/* Stat Cards Grid */}
            <div className="stats-grid">
              {/* Active Tasks */}
              <div className="hero-stat-card accent-blue table-row-animate" style={{ animationDelay: '0.1s' }}>
                <div className="stat-ring-wrap">
                  <ProgressRing progress={stats.activeProgress} color="#3B82F6" />
                  <div className="stat-ring-value">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="stat-label">Active Tasks</p>
                  <p className="stat-number">{stats.active}</p>
                  <p className="stat-detail">{stats.submitted} awaiting review</p>
                </div>
              </div>

              {/* Completed */}
              <div className="hero-stat-card accent-green table-row-animate" style={{ animationDelay: '0.2s' }}>
                <div className="stat-ring-wrap">
                  <ProgressRing progress={stats.completedProgress} color="#10B981" />
                  <div className="stat-ring-value">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="stat-label">Completed</p>
                  <p className="stat-number">{stats.completed}</p>
                  <p className="stat-detail">of {stats.total} total tasks</p>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="hero-stat-card accent-purple table-row-animate" style={{ animationDelay: '0.3s' }}>
                <div className="stat-ring-wrap">
                  <ProgressRing progress={stats.rate} color="#8B5CF6" />
                  <div className="stat-ring-value" style={{ fontSize: '15px', color: '#8B5CF6' }}>
                    {stats.rate}%
                  </div>
                </div>
                <div>
                  <p className="stat-label">Success Rate</p>
                  <p className="stat-number">{stats.rate}<span style={{ fontSize: '16px', color: 'var(--theme-text-muted)' }}>%</span></p>
                  <p className="stat-detail">{stats.approved} approved of {stats.total}</p>
                </div>
              </div>
            </div>

            {/* Quick Summary Bar */}
            {myTasks.length > 0 && (
              <div className="summary-bar table-row-animate" style={{ animationDelay: '0.4s' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'var(--theme-text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginRight: '4px' }}>
                  Breakdown
                </span>
                {SUMMARY_ITEMS.map(item => (
                  <span
                    key={item.key}
                    className="summary-pill"
                    style={{ background: item.bg, color: item.color, border: `1px solid ${item.border}` }}
                  >
                    <span className="summary-pill-dot" style={{ background: item.color }} />
                    {statusCounts[item.key]} {item.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-[13px] mb-4 px-4 py-3 rounded-lg"
            style={{ color: '#F87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </p>
        )}

        {/* ══════════════ ACTIVE TASKS (Command Center) ══════════════ */}
        <section className="mb-7 page-section">
          <div className="section-header-v2">
            <h2 className="section-title-v2">My Tasks</h2>
            <span className="section-count-v2">{myTasks.length}</span>
            <div className="section-divider-v2" />
          </div>
          <MyTasksList tasks={myTasks} onRefresh={handleRefresh} />
        </section>

        {/* ══════════════ AVAILABLE TASKS ══════════════ */}
        <section className="mb-7 page-section">
          <div className="section-header-v2">
            <h2 className="section-title-v2">Available Tasks</h2>
            <span className="section-count-v2">{availableTasks.length}</span>
            <div className="section-divider-v2" />
          </div>
          <AvailableTasksList tasks={availableTasks} onClaimed={handleRefresh} />
        </section>
      </main>
    </div>
  );
};

export default TalentDashboard;
