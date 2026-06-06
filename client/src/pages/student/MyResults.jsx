import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineChartBarSquare,
  HiOutlineArrowRight,
  HiOutlineExclamationTriangle,
  HiOutlineCheckBadge,
} from 'react-icons/hi2';

const MyResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchResults(); }, []);

  const fetchResults = async () => {
    try {
      const res = await API.get('/student/results');
      setResults(res.data.data);
    } catch (err) {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const formatTime = (sec) => {
    if (!sec) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-100">My Results</h1>
        <p className="text-surface-500 text-sm mt-1">{results.length} test{results.length !== 1 ? 's' : ''} attempted</p>
      </div>

      {results.length === 0 ? (
        <div className="bg-surface-900/60 border border-surface-800/50 rounded-2xl p-12 text-center">
          <HiOutlineChartBarSquare className="w-12 h-12 text-surface-600 mx-auto mb-3" />
          <p className="text-surface-400 text-sm">No results yet</p>
          <p className="text-surface-500 text-xs mt-1">Take a test to see your scores here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {results.map((r) => {
            const pass = (r.percentage || 0) >= 40;
            return (
              <div
                key={r._id}
                onClick={() => navigate(`/student/results/${r._id}`)}
                className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl p-5 hover:border-surface-700/50 transition-all cursor-pointer group"
              >
                {/* Title + Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-surface-200 truncate group-hover:text-surface-100 transition-colors">
                      {r.testId?.title || 'Unknown Test'}
                    </h3>
                    <p className="text-xs text-surface-500 mt-0.5">{r.testId?.subject || 'General'}</p>
                  </div>
                  <span className={`ml-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    pass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {pass ? 'PASS' : 'FAIL'}
                  </span>
                </div>

                {/* Score */}
                <div className="flex items-end gap-3 mb-4">
                  <p className={`text-3xl font-bold ${pass ? 'text-emerald-400' : 'text-red-400'}`}>
                    {r.percentage}%
                  </p>
                  <p className="text-sm text-surface-400 pb-0.5">
                    {r.score}/{r.totalMarks}
                  </p>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-surface-500">
                  <span>{formatDate(r.submittedAt)}</span>
                  <div className="flex items-center gap-2">
                    {r.autoSubmitted && (
                      <span className="flex items-center gap-1 text-red-400">
                        <HiOutlineExclamationTriangle className="w-3 h-3" /> Auto
                      </span>
                    )}
                    <span>{formatTime(r.timeTaken)}</span>
                  </div>
                </div>

                {/* View detail arrow */}
                <div className="mt-3 pt-3 border-t border-surface-800/30 flex items-center justify-end">
                  <span className="text-xs text-primary-400 group-hover:text-primary-300 flex items-center gap-1 transition-colors">
                    View Details <HiOutlineArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyResults;
