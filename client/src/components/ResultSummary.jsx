import {
  HiOutlineTrophy,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineMinusCircle,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineShieldExclamation,
} from 'react-icons/hi2';

/**
 * Reusable Result Summary component.
 * @param {{ result: object, showViolationBanner?: boolean }} props
 */
const ResultSummary = ({ result, showViolationBanner = true }) => {
  if (!result) return null;

  const percentage = result.percentage ?? 0;
  const passingPct = result.testId?.passingPercentage ?? 40;
  const passed = percentage >= passingPct;

  const correct = result.correctAnswers ?? 0;
  const incorrect = result.incorrectAnswers ?? 0;
  const unattempted = result.unattempted ?? 0;

  const formatTime = (sec) => {
    if (!sec) return '0m 0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  // ─── Donut chart via CSS conic-gradient ───
  const donutStyle = {
    background: `conic-gradient(
      ${passed ? '#10b981' : '#ef4444'} 0% ${percentage}%,
      rgba(255,255,255,0.08) ${percentage}% 100%
    )`,
  };

  const stats = [
    { label: 'Correct', value: correct, icon: HiOutlineCheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    { label: 'Incorrect', value: incorrect, icon: HiOutlineXCircle, color: 'text-red-400', bg: 'bg-red-500/15' },
    { label: 'Unattempted', value: unattempted, icon: HiOutlineMinusCircle, color: 'text-amber-400', bg: 'bg-amber-500/15' },
    { label: 'Time Taken', value: formatTime(result.timeTaken), icon: HiOutlineClock, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  ];

  return (
    <div className="space-y-4">
      {/* Main result card */}
      <div className={`rounded-2xl p-6 border ${passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Donut */}
          <div className="relative w-28 h-28 shrink-0">
            <div className="absolute inset-0 rounded-full" style={donutStyle} />
            <div className="absolute inset-2 bg-surface-950 rounded-full flex items-center justify-center">
              <div className="text-center">
                <p className={`text-2xl font-bold ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {percentage}%
                </p>
                <p className="text-[10px] text-surface-500 uppercase tracking-wider">
                  {passed ? 'Passed' : 'Failed'}
                </p>
              </div>
            </div>
          </div>

          {/* Score Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <HiOutlineTrophy className={`w-6 h-6 ${passed ? 'text-emerald-400' : 'text-red-400'}`} />
              <p className={`text-3xl font-bold ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.score}/{result.totalMarks}
              </p>
            </div>
            <p className="text-xs text-surface-500">
              {result.testId?.title || 'Test'} · Attempt #{result.attemptNumber || 1}
            </p>

            {/* Pass/Fail Badge */}
            <span className={`inline-block mt-2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {passed ? '✓ Passed' : '✗ Failed'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-surface-900/60 border border-surface-800/50 rounded-xl p-4 text-center">
              <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-lg font-bold text-surface-100">{s.value}</p>
              <p className="text-[10px] text-surface-500 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Auto-submitted warning */}
      {showViolationBanner && result.autoSubmitted && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <HiOutlineExclamationTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-400 font-medium">
            ⚠ This test was auto-submitted due to a security violation
          </p>
        </div>
      )}

      {/* Violations count */}
      {showViolationBanner && (result.violations?.length > 0 || result.violationCount > 0) && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <HiOutlineShieldExclamation className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-400 font-medium">
            {result.violations?.length || result.violationCount} proctoring violation{(result.violations?.length || result.violationCount) !== 1 ? 's' : ''} recorded
          </p>
        </div>
      )}
    </div>
  );
};

export default ResultSummary;
