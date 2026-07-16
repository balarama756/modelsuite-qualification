/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useMemo } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import { fetchAllSubmissions, reviewSubmission } from '../../api/submissions';

/* ── SVG Icons ── */
const IconSearch = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8.5" cy="8.5" r="5.5"/><path d="M17 17l-4-4"/>
  </svg>
);

const IconFile = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconX = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconInbox = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  </svg>
);

const IconExternalLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

/* ── Relative time ── */
const timeAgo = (raw) => {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    if (isNaN(d)) return '';
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return ''; }
};

/* ── Format full date ── */
const formatFullDate = (raw) => {
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    if (isNaN(d)) return raw;
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return raw; }
};

/* ── Status dot class helper ── */
const dotClass = (status) => {
  const s = (status || 'Pending').toLowerCase();
  return `status-dot status-dot-${s}`;
};

/* ── Review status badge class ── */
const REVIEW_BADGE = {
  Pending:  'status-badge-Submitted',
  Approved: 'status-badge-Approved',
  Rejected: 'status-badge-Rejected',
};

/* ── Stat pill config ── */
const STAT_PILLS = [
  { key: 'All',      label: 'All',      dot: null },
  { key: 'Pending',  label: 'Pending',  dot: 'status-dot-pending' },
  { key: 'Approved', label: 'Approved', dot: 'status-dot-approved' },
  { key: 'Rejected', label: 'Rejected', dot: 'status-dot-rejected' },
];

/* ═══════════════════════════════════════
   SubmissionsPage — Split-Pane Review
═══════════════════════════════════════ */
const SubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [selected, setSelected]      = useState(null);
  const [search, setSearch]          = useState('');
  const [filter, setFilter]          = useState('All');

  const loadSubmissions = async () => {
    try {
      const { data } = await fetchAllSubmissions();
      setSubmissions(data);
    } catch {
      alert('Failed to load submissions');
    }
  };

  useEffect(() => { loadSubmissions(); }, []);

  /* ── Counts ── */
  const counts = useMemo(() => ({
    All:      submissions.length,
    Pending:  submissions.filter(s => s.reviewStatus === 'Pending').length,
    Approved: submissions.filter(s => s.reviewStatus === 'Approved').length,
    Rejected: submissions.filter(s => s.reviewStatus === 'Rejected').length,
  }), [submissions]);

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    return submissions.filter(s => {
      const matchFilter = filter === 'All' || s.reviewStatus === filter;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        s.taskId?.title?.toLowerCase().includes(q) ||
        s.talentId?.name?.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [submissions, filter, search]);

  /* ── Review handler ── */
  const handleReview = async (status) => {
    if (!selected) return;
    try {
      await reviewSubmission(selected._id, status);
      await loadSubmissions();
      // Update selected with fresh data
      setSelected(prev => prev ? { ...prev, reviewStatus: status } : null);
    } catch (err) {
      alert(err.response?.data?.message || 'Review action failed');
    }
  };

  /* Keep selected in sync after data reload */
  useEffect(() => {
    if (selected) {
      const updated = submissions.find(s => s._id === selected._id);
      if (updated) setSelected(updated);
    }
    // eslint-disable-next-line
  }, [submissions]);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--theme-bg)', transition: 'background 0.35s ease' }}>
      <Sidebar />

      <main className="ml-[240px] flex-1 px-8 py-8" style={{ maxWidth: 'calc(100vw - 240px)' }}>

        {/* ── Page Header ── */}
        <div className="mb-6 page-section">
          <h1 className="text-[22px] font-semibold tracking-tight"
            style={{ color: 'var(--theme-text)', fontFamily: 'Poppins, sans-serif' }}>
            Submissions
          </h1>
          <p className="mt-0.5 text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
            Review talent submissions — click a card to see full details.
          </p>
        </div>

        {/* ── Stat Pills ── */}
        <div className="stat-pills mb-5 page-section">
          {STAT_PILLS.map(pill => (
            <button
              key={pill.key}
              className={`stat-pill ${filter === pill.key ? 'stat-pill-active' : ''}`}
              onClick={() => setFilter(pill.key)}
            >
              {pill.dot && <span className={`status-dot ${pill.dot}`} />}
              <span>{pill.label}</span>
              <span className="stat-pill-value">{counts[pill.key]}</span>
            </button>
          ))}
        </div>

        {/* ── Split Pane ── */}
        <div className="split-pane page-section">

          {/* ─── Left Pane: Submission Cards ─── */}
          <div className="split-left">
            <div className="split-left-header">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#4B5563' }}>
                  <IconSearch />
                </span>
                <input
                  type="text"
                  placeholder="Search by task or talent..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="sub-search-input"
                />
              </div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'var(--theme-text-faint)' }}>
                {filtered.length} submission{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="split-left-list">
              {filtered.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--theme-text-faint)' }}>
                    No submissions match your filters.
                  </p>
                </div>
              ) : (
                filtered.map((sub, i) => (
                  <div
                    key={sub._id}
                    className={`sub-card table-row-animate ${selected?._id === sub._id ? 'sub-card-active' : ''}`}
                    style={{ animationDelay: `${i * 0.04}s` }}
                    onClick={() => setSelected(sub)}
                  >
                    <div className="sub-card-avatar">
                      {sub.talentId?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="sub-card-body">
                      <p className="sub-card-title">{sub.taskId?.title || 'Untitled Task'}</p>
                      <p className="sub-card-meta">
                        <span>{sub.talentId?.name || 'Unknown'}</span>
                        <span>·</span>
                        <span>{timeAgo(sub.createdAt)}</span>
                      </p>
                    </div>
                    <span className={dotClass(sub.reviewStatus)} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ─── Right Pane: Detail View ─── */}
          <div className="split-right">
            {!selected ? (
              /* Empty state */
              <div className="detail-empty">
                <div className="detail-empty-icon">
                  <IconInbox />
                </div>
                <p className="detail-empty-text">Select a submission</p>
                <p className="detail-empty-sub">Click a card on the left to review its details</p>
              </div>
            ) : (
              /* Submission detail */
              <div className="detail-pane animate-fade-slide">
                {/* Header */}
                <div className="detail-pane-header">
                  <div>
                    <h2 className="detail-pane-title">{selected.taskId?.title || 'Untitled Task'}</h2>
                    <p className="detail-pane-subtitle">
                      Submitted {formatFullDate(selected.createdAt)}
                    </p>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-[11.5px] font-semibold ${REVIEW_BADGE[selected.reviewStatus] || 'status-badge-Submitted'}`}>
                    {selected.reviewStatus || 'Pending'}
                  </span>
                </div>

                {/* Talent info */}
                <div className="detail-section">
                  <p className="detail-section-label">Submitted By</p>
                  <div className="detail-section-content">
                    <div className="detail-talent-row">
                      <div className="detail-talent-avatar">
                        {selected.talentId?.name?.[0]?.toUpperCase() ?? 'T'}
                      </div>
                      <div>
                        <p className="detail-talent-name">{selected.talentId?.name || 'Unknown Talent'}</p>
                        <p className="detail-talent-email">{selected.talentId?.email || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Task info */}
                {selected.taskId?.description && (
                  <div className="detail-section">
                    <p className="detail-section-label">Task Description</p>
                    <div className="detail-section-content">
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--theme-text-secondary)', lineHeight: '1.6', margin: 0 }}>
                        {selected.taskId.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="detail-section">
                  <p className="detail-section-label">Submission Notes</p>
                  {selected.notes ? (
                    <div className="detail-section-content">
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13.5px', color: 'var(--theme-text-secondary)', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                        {selected.notes}
                      </p>
                    </div>
                  ) : (
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--theme-text-faint)', fontStyle: 'italic', margin: 0 }}>
                      No notes provided.
                    </p>
                  )}
                </div>

                {/* File */}
                <div className="detail-section">
                  <p className="detail-section-label">Attached File</p>
                  {selected.fileUrl ? (
                    <a href={selected.fileUrl} target="_blank" rel="noreferrer" className="detail-file-link">
                      <IconFile />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selected.fileUrl.split('/').pop() || 'Attachment'}
                      </span>
                      <IconExternalLink />
                    </a>
                  ) : (
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--theme-text-faint)', fontStyle: 'italic', margin: 0 }}>
                      No file attached.
                    </p>
                  )}
                </div>

                {/* Actions */}
                {selected.reviewStatus === 'Pending' ? (
                  <div className="detail-actions">
                    <button className="detail-btn detail-btn-reject" onClick={() => handleReview('Rejected')}>
                      <IconX /> Reject
                    </button>
                    <button className="detail-btn detail-btn-approve" onClick={() => handleReview('Approved')}>
                      <IconCheck /> Approve
                    </button>
                  </div>
                ) : (
                  <div className="detail-actions">
                    <div className={`reviewed-badge ${selected.reviewStatus === 'Approved' ? 'reviewed-badge-approved' : 'reviewed-badge-rejected'}`}>
                      {selected.reviewStatus === 'Approved' ? <IconCheck /> : <IconX />}
                      {selected.reviewStatus === 'Approved' ? 'Approved' : 'Rejected'}
                    </div>
                    <div style={{ flex: 1 }} />
                    <button
                      className="detail-btn detail-btn-reject"
                      style={{ flex: 'none', padding: '8px 16px', fontSize: '12px' }}
                      onClick={() => handleReview('Rejected')}
                    >
                      Re-reject
                    </button>
                    <button
                      className="detail-btn detail-btn-approve"
                      style={{ flex: 'none', padding: '8px 16px', fontSize: '12px' }}
                      onClick={() => handleReview('Approved')}
                    >
                      Re-approve
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubmissionsPage;
