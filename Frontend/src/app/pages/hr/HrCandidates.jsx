import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  MessageSquare,
  Shield,
  Star,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  XCircle
} from 'lucide-react';
import { HrLayout } from '../../components/HrLayout';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const rankMeta = [
  { icon: Trophy, color: '#f5b94c', bg: 'rgba(var(--warning-rgb),0.14)', border: 'rgba(var(--warning-rgb),0.24)' },
  { icon: Star, color: 'var(--info)', bg: 'rgba(var(--info-rgb),0.14)', border: 'rgba(var(--info-rgb),0.24)' },
  { icon: TrendingUp, color: 'var(--success)', bg: 'rgba(var(--success-rgb),0.14)', border: 'rgba(var(--success-rgb),0.24)' }
];

function ScorePill({ score, label }) {
  if (score === null || score === undefined) return null;
  const color = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--destructive)';
  const tone = score >= 75 ? 'rgba(var(--success-rgb),0.12)' : score >= 50 ? 'rgba(var(--warning-rgb),0.12)' : 'rgba(239,82,95,0.12)';
  const border = score >= 75 ? 'rgba(var(--success-rgb),0.24)' : score >= 50 ? 'rgba(var(--warning-rgb),0.24)' : 'rgba(239,82,95,0.22)';

  return (
    <div className="text-right">
      {label && <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>}
      <span
        className="mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-semibold tabular-nums"
        style={{ background: tone, color, borderColor: border }}
      >
        {score}<span className="ml-0.5 text-xs opacity-70">/100</span>
      </span>
    </div>
  );
}

function ProctoringReview({ candidate }) {
  const events = Array.isArray(candidate.proctoringEvents) ? candidate.proctoringEvents : [];
  const recentEvents = [...events].slice(-6).reverse();
  const stats = events.reduce(
    (summary, event) => {
      summary.total += 1;

      if (event.severity === 'critical') {
        summary.critical += 1;
      } else if (event.severity === 'warning') {
        summary.warning += 1;
      } else {
        summary.info += 1;
      }

      return summary;
    },
    { total: 0, critical: 0, warning: 0, info: 0 }
  );

  return (
    <div className="surface-panel-soft rounded-[1.5rem] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            Proctoring Summary
          </p>
          <p className="text-sm leading-7 text-muted-foreground">
            Event capture from the integrated webcam/session monitor during the interview.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Total', value: stats.total, color: 'var(--info)', bg: 'rgba(var(--info-rgb),0.12)', border: 'rgba(var(--info-rgb),0.24)' },
            { label: 'Critical', value: stats.critical, color: 'var(--destructive)', bg: 'rgba(239,82,95,0.12)', border: 'rgba(239,82,95,0.24)' },
            { label: 'Warning', value: stats.warning, color: 'var(--warning)', bg: 'rgba(var(--warning-rgb),0.12)', border: 'rgba(var(--warning-rgb),0.24)' }
          ].map((item) => (
            <span
              key={item.label}
              className="inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={{ color: item.color, background: item.bg, borderColor: item.border }}
            >
              {item.label}: {item.value}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.2rem] border border-white/8 bg-white/4 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Eye className="h-3.5 w-3.5" />
            Latest Signals
          </p>

          {recentEvents.length === 0 ? (
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              No proctoring events were recorded for this session.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentEvents.map((event, index) => (
                <div key={`${event.eventType}-${event.timestamp}-${index}`} className="rounded-[1rem] border border-white/8 bg-black/10 px-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {(event.eventType || 'UNKNOWN').replaceAll('_', ' ')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Unknown time'}
                    </span>
                  </div>
                  {event.message && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{event.message}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="rounded-[1.2rem] border p-4"
          style={{
            borderColor: stats.critical > 0 ? 'rgba(239,82,95,0.24)' : 'rgba(var(--success-rgb),0.22)',
            background: stats.critical > 0 ? 'rgba(239,82,95,0.08)' : 'rgba(var(--success-rgb),0.07)'
          }}
        >
          <p
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: stats.critical > 0 ? 'var(--destructive)' : 'var(--success)' }}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Recruiter Review Note
          </p>
          <p className="mt-4 text-sm leading-7 text-foreground">
            {stats.critical > 0
              ? 'Critical proctoring activity was detected during the interview. Review these events with the transcript and score before making a decision.'
              : stats.warning > 0
                ? 'Only warning-level proctoring signals were recorded. Review them for context, but the interview completed normally.'
                : 'No suspicious proctoring activity was recorded in the integrated monitoring flow.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function EvaluationPanel({ candidate }) {
  const hasEval = candidate.evaluationStatus === 'complete' || candidate.interviewScore !== null;
  const hasTranscript = Array.isArray(candidate.interviewTranscript) && candidate.interviewTranscript.length > 0;
  const hasProctoring = Array.isArray(candidate.proctoringEvents) && candidate.proctoringEvents.length > 0;

  if (!hasEval && !hasTranscript && !hasProctoring) {
    return (
      <div className="px-6 pb-6 pt-2">
        <div className="empty-state rounded-[1.4rem] p-5 text-center">
          <p className="text-sm text-muted-foreground">
            Interview not yet completed. Evaluation will appear here once the candidate finishes the process.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6 pt-2 space-y-5">
      {!hasEval && hasTranscript && (
        <div className="surface-panel-soft rounded-[1.5rem] p-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Evaluation In Progress
          </p>
          <p className="text-sm leading-7 text-foreground">
            The interview transcript is available below. The final AI evaluation is still being prepared and will appear here automatically after refresh.
          </p>
        </div>
      )}

      {candidate.overallSummary && (
        <div className="surface-panel-soft rounded-[1.5rem] p-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            Overall Summary
          </p>
          <p className="text-sm leading-7 text-foreground">{candidate.overallSummary}</p>
        </div>
      )}

      {((candidate.strengths?.length > 0) || (candidate.weaknesses?.length > 0)) && (
        <div className="grid gap-4 md:grid-cols-2">
          {candidate.strengths?.length > 0 && (
            <div className="rounded-[1.5rem] border p-5" style={{ borderColor: 'rgba(var(--success-rgb),0.22)', background: 'rgba(var(--success-rgb),0.07)' }}>
              <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--success)]">
                <TrendingUp className="h-3.5 w-3.5" />
                Strengths
              </p>
              <ul className="space-y-2">
                {candidate.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-7 text-foreground">
                    <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--success)]" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {candidate.weaknesses?.length > 0 && (
            <div className="rounded-[1.5rem] border p-5" style={{ borderColor: 'rgba(var(--warning-rgb),0.22)', background: 'rgba(var(--warning-rgb),0.07)' }}>
              <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--warning)]">
                <TrendingDown className="h-3.5 w-3.5" />
                Areas to Improve
              </p>
              <ul className="space-y-2">
                {candidate.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-7 text-foreground">
                    <XCircle className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--warning)]" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {candidate.questionFeedback?.length > 0 && (
        <div className="surface-panel-soft rounded-[1.5rem] p-5">
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <BarChart2 className="h-3.5 w-3.5" />
            Question Breakdown
          </p>
          <div className="space-y-4">
            {candidate.questionFeedback.map((item, idx) => (
              <div key={idx} className="rounded-[1.2rem] border border-white/8 bg-white/4 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Q{idx + 1}</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{item.question}</p>
                {item.candidateAnswer && (
                  <p className="mt-2 text-sm italic leading-7 text-muted-foreground">
                    &ldquo;{item.candidateAnswer}&rdquo;
                  </p>
                )}
                <p className="mt-3 text-sm leading-7 text-foreground">{item.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasTranscript && (
        <div className="surface-panel-soft rounded-[1.5rem] p-5">
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            Interview Transcript
          </p>
          <div className="space-y-4">
            {candidate.interviewTranscript.map((entry, idx) => (
              <div key={`${entry.question}-${idx}`} className="rounded-[1.2rem] border border-white/8 bg-white/4 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Q{idx + 1}</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{entry.question}</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {entry.candidateAnswer || 'No answer recorded.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {candidate.finalRecommendation && (
        <div className="rounded-[1.5rem] border p-5" style={{ borderColor: 'rgba(var(--primary-rgb),0.22)', background: 'rgba(var(--primary-rgb),0.08)' }}>
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            <Target className="h-3.5 w-3.5" />
            Hiring Recommendation
          </p>
          <p className="text-sm leading-7 text-foreground">{candidate.finalRecommendation}</p>
        </div>
      )}

      {(hasProctoring || hasTranscript) && <ProctoringReview candidate={candidate} />}
    </div>
  );
}

export function HrCandidates() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { loadData(); }, [jobId]);

  useEffect(() => {
    const hasPendingInterviewWork = candidates.some((candidate) => (
      candidate.evaluationStatus === 'pending' ||
      ((candidate.interviewTranscript?.length || 0) > 0 && candidate.interviewScore === null)
    ));

    if (!jobId || !hasPendingInterviewWork) {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      if (document.hidden) {
        return;
      }

      try {
        const refreshedCandidates = await api.getCandidatesByJob(jobId);
        setCandidates(refreshedCandidates);
      } catch (error) {
        console.error('Background candidate refresh failed:', error);
      }
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, [jobId, candidates]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobData, candidatesData] = await Promise.all([
        api.getJobById(jobId),
        api.getCandidatesByJob(jobId)
      ]);
      setJob(jobData);
      setCandidates(candidatesData);
    } catch (e) {
      console.error('Failed to load candidates:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async (candidate) => {
    const confirmed = window.confirm(
      `Delete candidate "${candidate.name}"?\n\nThis will permanently remove all their interview data and cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(candidate._id);
    try {
      await api.deleteCandidate(jobId, candidate._id);
      setCandidates((prev) => prev.filter((c) => c._id !== candidate._id));
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(candidate._id);
        return next;
      });
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete candidate. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading candidates..." />;
  }

  if (!job) {
    return (
      <LoadingSpinner message="Unable to load the selected job." />
    );
  }

  const avgAts = candidates.length
    ? Math.round(candidates.reduce((s, c) => s + (c.atsMatchScore || 0), 0) / candidates.length)
    : 0;
  const interviewedCount = candidates.filter((c) => c.interviewScore !== null).length;

  const overviewStats = [
    { label: 'Total Applicants', value: candidates.length, icon: Users, color: 'var(--primary)', tone: 'rgba(var(--primary-rgb),0.12)' },
    { label: 'Interviewed', value: interviewedCount, icon: CheckCircle2, color: 'var(--success)', tone: 'rgba(var(--success-rgb),0.12)' },
    { label: 'Avg ATS Score', value: `${avgAts}%`, icon: BarChart2, color: 'var(--info)', tone: 'rgba(var(--info-rgb),0.12)' }
  ];

  return (
    <HrLayout
      active="jobs"
      eyebrow="Candidate Review"
      title={job.title}
      subtitle="Review applicants ranked by ATS match score, expand full evaluations, and preserve the same candidate management actions."
      actions={(
        <button
          type="button"
          onClick={() => navigate('/hr/jobs')}
          className="control-button control-button-ghost px-4 py-2.5 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </button>
      )}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {overviewStats.map(({ label, value, icon: Icon, color, tone }) => (
            <div key={label} className="surface-panel rounded-[1.7rem] p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: tone }}>
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
              </div>
              <p className="metric-value text-foreground">{value}</p>
            </div>
          ))}
        </div>

        <div className="surface-panel overflow-hidden rounded-[1.9rem]">
          <div className="flex flex-col gap-2 border-b border-border/70 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="section-kicker mb-3">Ranked Candidates</span>
              <h2 className="text-2xl font-bold text-foreground">Leaderboard and evaluation detail</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Sorted by ATS match score. Expand any row to inspect the full interview evaluation.
            </p>
          </div>

          {candidates.length === 0 ? (
            <div className="empty-state m-6 flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <Users className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="text-xl font-bold text-foreground">No candidates have applied yet</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Applicants will appear here once the public job flow starts collecting submissions.
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {candidates.map((c, i) => {
                const rm = rankMeta[i] || { icon: Users, color: 'var(--muted-foreground)', bg: 'rgba(var(--foreground-rgb),0.06)', border: 'rgba(var(--foreground-rgb),0.08)' };
                const RankIcon = rm.icon;
                const isExpanded = expandedIds.has(c._id);
                const isDeleting = deletingId === c._id;
                const hasInterview = c.interviewScore !== null;
                const hasTranscript = (c.interviewTranscript?.length || 0) > 0;
                const isEvaluationPending = c.evaluationStatus === 'pending' || (hasTranscript && c.interviewScore === null);

                return (
                  <motion.div
                    key={c._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.28 }}
                  >
                    <div
                      className="cursor-pointer px-6 py-5 transition-colors hover:bg-white/[0.025]"
                      onClick={() => toggleExpand(c._id)}
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex w-8 flex-shrink-0 flex-col items-center">
                            <RankIcon className="mb-1 h-4 w-4" style={{ color: rm.color }} />
                            <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                          </div>

                          <div
                            className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border font-semibold"
                            style={{ background: rm.bg, borderColor: rm.border, color: rm.color }}
                          >
                            {c.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="text-base font-semibold text-foreground">{c.name}</span>
                              <span
                                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                                style={{
                                  background: c.status === 'Applied' ? 'rgba(var(--info-rgb),0.12)' : 'rgba(var(--success-rgb),0.12)',
                                  color: c.status === 'Applied' ? 'var(--info)' : 'var(--success)'
                                }}
                              >
                                {c.status}
                              </span>
                              {hasInterview && (
                                <span className="badge-interviewed rounded-full px-2.5 py-1 text-xs font-semibold">
                                  Interviewed
                                </span>
                              )}
                              {isEvaluationPending && (
                                <span
                                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                                  style={{
                                    background: 'rgba(var(--warning-rgb),0.12)',
                                    color: 'var(--warning)'
                                  }}
                                >
                                  Evaluation pending
                                </span>
                              )}
                            </div>
                            <p className="truncate text-sm text-muted-foreground">{c.email}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              Applied {new Date(c.appliedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 xl:justify-end">
                          <ScorePill score={c.atsMatchScore} label="ATS" />
                          {hasInterview && <ScorePill score={c.interviewScore} label="Interview" />}

                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDelete(c)}
                              disabled={isDeleting}
                              className="control-button justify-center rounded-2xl px-3 py-3 text-sm text-[var(--destructive)] disabled:opacity-40"
                              title="Delete candidate"
                            >
                              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => toggleExpand(c._id)}
                              className="control-button justify-center rounded-2xl px-3 py-3 text-sm"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.24, ease: 'easeInOut' }}
                          style={{ overflow: 'hidden', borderTop: '1px solid var(--border)' }}
                        >
                          <EvaluationPanel candidate={c} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </HrLayout>
  );
}
