import { useState } from 'react';
import SubmitTaskModal from './SubmitTaskModal';

/* ── Status badge classes (kept for compatibility) ── */
const STATUS_CLASS = {
  Open:      'status-badge-Open',
  Claimed:   'status-badge-Claimed',
  Submitted: 'status-badge-Submitted',
  Approved:  'status-badge-Approved',
  Rejected:  'status-badge-Rejected',
};

/* ── Timeline step definitions ── */
const TIMELINE_STEPS = [
  { key: 'claimed',  label: 'Claimed' },
  { key: 'progress', label: 'In Progress' },
  { key: 'review',   label: 'Under Review' },
  { key: 'done',     label: 'Completed' },
];

/* ── Map task status to active step index & type ── */
const getStepState = (status, stepIndex) => {
  const map = {
    Claimed:   { activeIndex: 0, type: 'normal' },
    Submitted: { activeIndex: 2, type: 'normal' },
    Approved:  { activeIndex: 3, type: 'success' },
    Rejected:  { activeIndex: 2, type: 'rejected' },
  };
  const info = map[status] || { activeIndex: -1, type: 'normal' };

  if (info.type === 'rejected' && stepIndex === info.activeIndex) {
    return 'rejected';
  }
  if (info.type === 'success') {
    if (stepIndex <= info.activeIndex) return 'completed-success';
  }
  if (stepIndex < info.activeIndex) return 'completed';
  if (stepIndex === info.activeIndex) return 'active';
  return 'pending';
};

/* ── SVG icons for timeline dots ── */
const CheckIcon = () => (
  <svg className="timeline-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3.5 8.5 6.5 11.5 12.5 5.5" />
  </svg>
);

const XIcon = () => (
  <svg className="timeline-x" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="4" x2="12" y2="12" />
    <line x1="12" y1="4" x2="4" y2="12" />
  </svg>
);

/* ── Calendar icon ── */
const IconCalendar = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="14" height="14" rx="2"/>
    <path d="M7 2v4M13 2v4M3 9h14"/>
  </svg>
);

/* ── Upload icon ── */
const IconUpload = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 14V4M6 8l4-4 4 4"/>
    <path d="M3 17h14"/>
  </svg>
);

/* ── Empty state icon ── */
const IconRocket = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);

/* ── Smart date formatter with relative time ── */
const getRelativeDate = (raw) => {
  if (!raw) return null;
  try {
    const due = new Date(raw);
    if (isNaN(due)) return { text: raw, urgency: 'normal' };
    
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    const formatted = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (diffDays < 0) {
      return { text: `Overdue · ${formatted}`, urgency: 'overdue' };
    }
    if (diffDays === 0) {
      return { text: `Due today`, urgency: 'soon' };
    }
    if (diffDays === 1) {
      return { text: `Due tomorrow`, urgency: 'soon' };
    }
    if (diffDays <= 3) {
      return { text: `${diffDays} days left · ${formatted}`, urgency: 'soon' };
    }
    return { text: `Due ${formatted}`, urgency: 'normal' };
  } catch {
    return { text: raw, urgency: 'normal' };
  }
};

/* ── Timeline Step Component ── */
const TimelineStep = ({ label, state }) => {
  let stepClass = 'timeline-step';
  if (state === 'completed')         stepClass += ' step-completed';
  if (state === 'completed-success') stepClass += ' step-completed step-success';
  if (state === 'active')            stepClass += ' step-active';
  if (state === 'rejected')          stepClass += ' step-rejected';

  const renderDotContent = () => {
    if (state === 'completed') return <CheckIcon />;
    if (state === 'completed-success') return <CheckIcon />;
    if (state === 'rejected') return <XIcon />;
    return <div className="timeline-dot-inner" />;
  };

  return (
    <div className={stepClass}>
      <div className="timeline-dot">
        {renderDotContent()}
      </div>
      <span className="timeline-label">{label}</span>
    </div>
  );
};

/* ── Visual Task Timeline ── */
const TaskTimeline = ({ status }) => (
  <div className="task-timeline">
    {TIMELINE_STEPS.map((step, i) => (
      <TimelineStep
        key={step.key}
        label={step.label}
        state={getStepState(status, i)}
      />
    ))}
  </div>
);

/* ═══════════════════════════════════════
   MyTasksList — V2 Command Center Cards
═══════════════════════════════════════ */
const MyTasksList = ({ tasks, onRefresh }) => {
  const [submitTarget, setSubmitTarget] = useState(null);

  if (!tasks || tasks.length === 0) {
    return (
      <div className="empty-state-v2">
        <div className="empty-state-v2-icon">
          <IconRocket />
        </div>
        <p className="empty-state-v2-title">No active tasks yet</p>
        <p className="empty-state-v2-sub">Claim a task from the available list to get started!</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {tasks.map((task, i) => {
          const due = getRelativeDate(task.dueDate);
          const dueBadgeClass = due
            ? `due-badge due-badge-${due.urgency}`
            : '';

          return (
            <div
              key={task._id}
              className="task-card-v2 table-row-animate"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              {/* Header: Title + Status Badge */}
              <div className="task-card-v2-header">
                <div className="flex-1 min-w-0">
                  <p className="task-card-v2-title">{task.title || 'Untitled Task'}</p>
                  {task.description && (
                    <p className="task-card-v2-desc" style={{ marginTop: '4px' }}>{task.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {due && (
                    <span className={dueBadgeClass}>
                      <IconCalendar />
                      {due.text}
                    </span>
                  )}
                  {task.status && (
                    <span
                      className={`inline-block px-2.5 py-[3px] rounded-full text-[11px] font-medium ${STATUS_CLASS[task.status] || ''}`}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {task.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Visual Timeline */}
              <TaskTimeline status={task.status} />

              {/* Footer: Actions */}
              <div className="task-card-v2-footer">
                <div className="flex items-center gap-2">
                  {task.createdBy?.name && (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                      Assigned by {task.createdBy.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(task.status === 'Claimed' || task.status === 'Submitted') && (
                    <button
                      onClick={() => setSubmitTarget(task)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold cursor-pointer border transition-all"
                      style={{
                        background: 'rgba(59,130,246,0.08)',
                        color: '#60A5FA',
                        borderColor: 'rgba(59,130,246,0.25)',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(59,130,246,0.16)';
                        e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(59,130,246,0.08)';
                        e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)';
                      }}
                    >
                      <IconUpload />
                      {task.status === 'Submitted' ? 'Re-submit' : 'Submit Work'}
                    </button>
                  )}
                  {task.status === 'Approved' && (
                    <span style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#34D399',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      Task Completed
                    </span>
                  )}
                  {task.status === 'Rejected' && (
                    <span style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#F87171',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      Needs Revision
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {submitTarget && (
        <SubmitTaskModal
          task={submitTarget}
          onClose={() => setSubmitTarget(null)}
          onSubmitted={() => { setSubmitTarget(null); if (onRefresh) onRefresh(); }}
        />
      )}
    </>
  );
};

export default MyTasksList;
