import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ThemeToggle';

/* ── Clean SVG line-art icons ── */
const IconDashboard = () => (
  <svg className="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="7" height="7" rx="1.5"/>
    <rect x="11" y="2" width="7" height="7" rx="1.5"/>
    <rect x="2" y="11" width="7" height="7" rx="1.5"/>
    <rect x="11" y="11" width="7" height="7" rx="1.5"/>
  </svg>
);

const IconTasks = () => (
  <svg className="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 10l2 2 4-4"/>
    <rect x="3" y="3" width="14" height="14" rx="2"/>
  </svg>
);

const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 10H3M13 10l-3-3M13 10l-3 3"/>
    <path d="M7 4H4a1 1 0 00-1 1v10a1 1 0 001 1h3"/>
  </svg>
);

const navItems = [
  { label: 'My Dashboard', path: '/talent/dashboard', Icon: IconDashboard },
  { label: 'My Tasks',     path: '/talent/tasks',     Icon: IconTasks     },
];

const TalentSidebar = () => {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 w-[220px] flex flex-col z-50"
      style={{ background: 'var(--theme-sidebar)', borderRight: '1px solid var(--theme-border)', transition: 'background 0.35s ease, border-color 0.35s ease' }}>

      {/* Brand */}
      <div className="flex items-center justify-center px-5 py-6">
        <img src="/modelsuite-talents.png" alt="ModelSuite Talents" className="w-36 h-auto object-contain" />
      </div>

      <div className="sidebar-divider mx-4" />

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1 px-3 pt-5">
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] px-2 mb-2"
          style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter, sans-serif' }}>
          Menu
        </p>

        {navItems.map(({ label, path, Icon }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <button key={path}
              onClick={() => navigate(path)}
              className={`nav-item ${isActive ? 'nav-active' : ''}`}>
              <Icon />
              <span>{label}</span>
            </button>
          );
        })}

        <div className="sidebar-divider my-3" />

        <div className="nav-item flex items-center justify-between" style={{ cursor: 'default' }}>
          <div className="flex items-center gap-2.5">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            <span>Theme</span>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5">
        <div className="sidebar-divider mb-3" />
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full avatar-talent flex items-center justify-center text-[12px] font-bold text-white shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'T'}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold truncate max-w-[100px]"
                style={{ color: 'var(--theme-text-secondary)', fontFamily: 'Inter, sans-serif' }}>
                {user?.name}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>Talent</p>
            </div>
          </div>

          <button
            onClick={() => { logout(); navigate('/login'); }}
            title="Sign out"
            className="logout-btn">
            <IconLogout />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default TalentSidebar;
