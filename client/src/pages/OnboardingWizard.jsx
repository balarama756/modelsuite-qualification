/* eslint-disable react-hooks/purity */
import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

/* ── Skill options ── */
const SKILLS = [
  { id: 'react',      label: 'React',      emoji: '⚛️' },
  { id: 'nodejs',     label: 'Node.js',    emoji: '🟢' },
  { id: 'python',     label: 'Python',     emoji: '🐍' },
  { id: 'typescript', label: 'TypeScript', emoji: '🔷' },
  { id: 'uiux',       label: 'UI/UX',      emoji: '🎨' },
  { id: 'devops',     label: 'DevOps',     emoji: '🔧' },
  { id: 'cloud',      label: 'Cloud',      emoji: '☁️' },
  { id: 'database',   label: 'Database',   emoji: '🗄️' },
  { id: 'mobile',     label: 'Mobile',     emoji: '📱' },
  { id: 'testing',    label: 'Testing',    emoji: '🧪' },
  { id: 'security',   label: 'Security',   emoji: '🔒' },
  { id: 'aiml',       label: 'AI / ML',    emoji: '🤖' },
];

/* ── Confetti colors ── */
const CONFETTI_COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#6366F1','#14B8A6'];

/* ── Icons ── */
const TalentIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const AdminIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const CheckSmall = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3.5 8.5 6.5 11.5 12.5 5.5"/>
  </svg>
);

/* ── Step definitions ── */
const STEPS = [
  { key: 'role',    label: 'Role' },
  { key: 'details', label: 'Details' },
  { key: 'skills',  label: 'Skills' },
  { key: 'done',    label: 'Done' },
];

const inputCls = 'w-full bg-bg-input border border-border rounded-[10px] px-4 py-3 text-[15px] text-text-primary outline-none placeholder:text-text-faint focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-all duration-200 font-sans hover:border-border-light';
const labelCls = 'text-[11px] font-semibold uppercase tracking-[0.6px] text-text-muted';

/* ════════════════════════════════════════════
   ONBOARDING WIZARD
════════════════════════════════════════════ */
const OnboardingWizard = () => {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  /* Actual steps visible (skip skills for Admin) */
  const visibleSteps = useMemo(() => {
    if (role === 'Admin') return STEPS.filter(s => s.key !== 'skills');
    return STEPS;
  }, [role]);

  const currentStepKey = visibleSteps[step]?.key;
  const totalSteps = visibleSteps.length;

  /* Progress fill width */
  const fillPct = step === 0 ? 0 : ((step) / (totalSteps - 1)) * 100;
  const barRightPx = 28; // matches CSS left offset
  const maxBarWidth = `calc(100% - ${barRightPx * 2}px)`;

  /* Navigate between steps */
  const goNext = async () => {
    if (animating || submitting) return;

    // Validation
    if (currentStepKey === 'role' && !role) return;
    if (currentStepKey === 'details') {
      if (!name.trim() || !email.trim() || !password.trim()) {
        setError('Please fill in all fields');
        return;
      }
      if (password.length < 4) {
        setError('Password must be at least 4 characters');
        return;
      }
      setError('');
    }
    if (currentStepKey === 'skills' && skills.length < 2) return;

    // If next step is "done", register the user
    const nextKey = visibleSteps[step + 1]?.key;
    if (nextKey === 'done') {
      setSubmitting(true);
      setError('');
      try {
        const { data } = await API.post('/auth/register', { name, email, password, role });
        // Save skills to localStorage
        if (skills.length > 0) {
          localStorage.setItem('userSkills', JSON.stringify(skills));
        }
        login(data);
        setAnimating(true);
        setTimeout(() => {
          setStep(step + 1);
          setAnimating(false);
          setSubmitting(false);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }, 300);
      } catch (err) {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
        setSubmitting(false);
      }
      return;
    }

    // Animate transition
    setAnimating(true);
    setTimeout(() => {
      setStep(s => s + 1);
      setAnimating(false);
    }, 300);
  };

  const goBack = () => {
    if (animating || step === 0) return;
    setAnimating(true);
    setError('');
    setTimeout(() => {
      setStep(s => s - 1);
      setAnimating(false);
    }, 300);
  };

  const toggleSkill = (id) => {
    setSkills(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const canProceed = () => {
    if (currentStepKey === 'role') return !!role;
    if (currentStepKey === 'details') return name.trim() && email.trim() && password.trim();
    if (currentStepKey === 'skills') return skills.length >= 2;
    return false;
  };

  /* ── Confetti particles ── */
  const confettiPieces = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      bg: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: `${Math.random() * 1.5}s`,
      size: 6 + Math.random() * 6,
    })), []
  );

  return (
    <div className="wizard-container">

      {/* ── Confetti ── */}
      {showConfetti && (
        <div className="wizard-confetti">
          {confettiPieces.map(p => (
            <div key={p.id} className="confetti-piece"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                background: p.bg,
                animationDelay: p.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Progress Bar ── */}
      {currentStepKey !== 'done' && (
        <div className="wizard-progress">
          <div className="wizard-progress-bar">
            <div className="wizard-progress-fill"
              style={{ width: `calc(${maxBarWidth} * ${fillPct / 100})` }}
            />
            {visibleSteps.map((s, i) => (
              <div key={s.key} className="wizard-step-indicator">
                <div className={`wizard-step-dot ${i === step ? 'step-active' : ''} ${i < step ? 'step-done' : ''}`}>
                  {i < step ? <CheckSmall /> : i + 1}
                </div>
                <span className={`wizard-step-label ${i === step ? 'label-active' : ''} ${i < step ? 'label-done' : ''}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Step Content ── */}
      <div className="wizard-body">
        <div className={`wizard-step-content ${animating ? 'wizard-step-exit' : ''}`} key={step}>

          {/* STEP 1 — Role */}
          {currentStepKey === 'role' && (
            <>
              <h1 className="wizard-title">Welcome to ModelSuite</h1>
              <p className="wizard-subtitle">Let's get you started. How will you be using the platform?</p>
              <div className="wizard-role-grid">
                <div className={`wizard-role-card ${role === 'Talent' ? 'role-selected' : ''}`}
                  onClick={() => setRole('Talent')}>
                  <div className="wizard-role-icon"><TalentIcon /></div>
                  <p className="wizard-role-title">Talent</p>
                  <p className="wizard-role-desc">I'm joining to complete assessments and showcase my skills</p>
                </div>
                <div className={`wizard-role-card ${role === 'Admin' ? 'role-selected' : ''}`}
                  onClick={() => setRole('Admin')}>
                  <div className="wizard-role-icon"><AdminIcon /></div>
                  <p className="wizard-role-title">Admin</p>
                  <p className="wizard-role-desc">I'll manage tasks, review submissions, and evaluate talent</p>
                </div>
              </div>
            </>
          )}

          {/* STEP 2 — Details */}
          {currentStepKey === 'details' && (
            <>
              <h1 className="wizard-title">Create Your Account</h1>
              <p className="wizard-subtitle">We just need a few details to set up your profile.</p>
              <div className="wizard-form">
                <div className="wizard-field">
                  <label className={labelCls} htmlFor="wiz-name">Full Name</label>
                  <input id="wiz-name" type="text" placeholder="Jane Doe"
                    value={name} onChange={e => setName(e.target.value)} className={inputCls} />
                </div>
                <div className="wizard-field">
                  <label className={labelCls} htmlFor="wiz-email">Email Address</label>
                  <input id="wiz-email" type="email" placeholder="you@company.com"
                    value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
                </div>
                <div className="wizard-field">
                  <label className={labelCls} htmlFor="wiz-password">Password</label>
                  <input id="wiz-password" type="password" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} className={inputCls} />
                </div>
                {error && (
                  <p style={{ color: '#EF4444', fontSize: '13px', fontFamily: 'Inter, sans-serif', margin: 0 }}>{error}</p>
                )}
              </div>
            </>
          )}

          {/* STEP 3 — Skills */}
          {currentStepKey === 'skills' && (
            <>
              <h1 className="wizard-title">Your Skills & Interests</h1>
              <p className="wizard-subtitle">Select the areas you're most passionate about. Pick at least 2.</p>
              <div className="wizard-skills-grid">
                {SKILLS.map(s => (
                  <button key={s.id}
                    className={`wizard-skill-pill ${skills.includes(s.id) ? 'pill-selected' : ''}`}
                    onClick={() => toggleSkill(s.id)}>
                    <span>{s.emoji}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
              <p className="wizard-skills-hint">
                <strong>{skills.length}</strong> / 2 minimum selected
              </p>
            </>
          )}

          {/* STEP 4 — Success */}
          {currentStepKey === 'done' && (
            <div className="wizard-success">
              <div className="wizard-check-ring">
                <svg className="wizard-check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 12 9 17 20 6"/>
                </svg>
              </div>
              <h1 className="wizard-title">You're All Set, {name.split(' ')[0]}! 🎉</h1>
              <p className="wizard-subtitle" style={{ marginBottom: '12px' }}>
                Your account has been created successfully. Welcome to ModelSuite!
              </p>
              <button
                className="wizard-btn wizard-btn-next"
                onClick={() => navigate(role === 'Admin' ? '/admin/dashboard' : '/talent/dashboard')}>
                Go to Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation ── */}
      {currentStepKey !== 'done' && (
        <div className="wizard-nav">
          {step > 0 ? (
            <button className="wizard-btn wizard-btn-back" onClick={goBack}>← Back</button>
          ) : (
            <Link to="/login" className="wizard-btn wizard-btn-back" style={{ textDecoration: 'none' }}>
              ← Sign In
            </Link>
          )}
          <button
            className="wizard-btn wizard-btn-next"
            disabled={!canProceed() || submitting}
            onClick={goNext}>
            {submitting ? 'Creating Account...' : visibleSteps[step + 1]?.key === 'done' ? 'Create Account' : 'Continue →'}
          </button>
        </div>
      )}
    </div>
  );
};

export default OnboardingWizard;
