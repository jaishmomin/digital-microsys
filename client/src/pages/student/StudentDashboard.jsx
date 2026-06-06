import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineChartBarSquare,
  HiOutlineTrophy,
  HiOutlineSignal,
  HiOutlineClock,
  HiOutlinePlayCircle,
  HiOutlineCheckBadge,
  HiOutlineArrowRight,
} from 'react-icons/hi2';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [testsRes, resultsRes] = await Promise.all([
        API.get('/student/tests'),
        API.get('/student/results'),
      ]);
      setTests(testsRes.data.data);
      setResults(resultsRes.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const liveTests = tests.filter((t) => t.liveStatus === 'live');
  const upcomingTests = tests.filter((t) => t.liveStatus === 'upcoming');
  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length)
    : 0;
  const bestScore = results.length > 0
    ? Math.max(...results.map((r) => r.percentage || 0))
    : 0;

  const stats = [
    { label: 'Tests Attempted', value: results.length, icon: HiOutlineClipboardDocumentList, gradient: 'from-primary-500 to-primary-700', glow: 'shadow-primary-500/20' },
    { label: 'Average Score', value: `${avgScore}%`, icon: HiOutlineChartBarSquare, gradient: 'from-emerald-500 to-emerald-700', glow: 'shadow-emerald-500/20' },
    { label: 'Best Score', value: `${bestScore}%`, icon: HiOutlineTrophy, gradient: 'from-amber-500 to-amber-700', glow: 'shadow-amber-500/20' },
    { label: 'Tests Available', value: liveTests.length, icon: HiOutlineSignal, gradient: 'from-rose-500 to-rose-700', glow: 'shadow-rose-500/20' },
  ];

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  const getTimeUntil = (start) => {
    const diff = new Date(start) - new Date();
    if (diff <= 0) return 'Now';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-900/40 to-primary-800/20 border border-primary-700/30 rounded-2xl p-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-surface-100">
          {greeting()}, <span className="text-primary-400">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-surface-400 mt-1 text-sm">
          Roll No: <span className="text-surface-300 font-mono">{user?.rollNumber}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl p-4 sm:p-5 group hover:border-surface-700/50 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-surface-500 uppercase tracking-wider">{s.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-surface-100 mt-1.5">{s.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg ${s.glow} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Available Tests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-200">Available Tests</h2>
        </div>

        {liveTests.length === 0 && upcomingTests.length === 0 ? (
          <div className="bg-surface-900/60 border border-surface-800/50 rounded-2xl p-10 text-center">
            <HiOutlineClipboardDocumentList className="w-10 h-10 text-surface-600 mx-auto mb-2" />
            <p className="text-surface-500 text-sm">No tests available right now</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Live tests first */}
            {[...liveTests, ...upcomingTests].map((test) => {
              const isLive = test.liveStatus === 'live';
              return (
                <div key={test._id} className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl p-5 hover:border-surface-700/50 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-surface-200 truncate">{test.title}</h3>
                      <p className="text-xs text-surface-500 mt-0.5">{test.subject || 'General'}</p>
                    </div>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      isLive ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {isLive ? '● LIVE' : 'UPCOMING'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 text-xs text-surface-400">
                    <div className="flex items-center gap-2">
                      <HiOutlineClock className="w-3.5 h-3.5" />
                      <span>{test.duration} minutes · {test.totalQuestions} questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HiOutlineClipboardDocumentList className="w-3.5 h-3.5" />
                      <span>{formatDate(test.startTime)} – {formatDate(test.endTime)}</span>
                    </div>
                  </div>

                  {test.hasAttempted ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 text-xs font-medium">
                        <HiOutlineCheckBadge className="w-3.5 h-3.5" />
                        Attempted · {test.bestPercentage}%
                      </span>
                    </div>
                  ) : isLive ? (
                    <button onClick={() => navigate(`/student/test/${test._id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-primary-500/20 cursor-pointer">
                      <HiOutlinePlayCircle className="w-4 h-4" /> Start Test
                    </button>
                  ) : (
                    <button disabled
                      className="flex items-center gap-2 px-4 py-2 bg-surface-800/50 text-surface-500 rounded-xl text-xs font-medium">
                      <HiOutlineClock className="w-4 h-4" /> Starts in {getTimeUntil(test.startTime)}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Previous Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-200">Previous Results</h2>
          {results.length > 0 && (
            <Link to="/student/results" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <HiOutlineArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {results.length === 0 ? (
          <div className="bg-surface-900/60 border border-surface-800/50 rounded-2xl p-10 text-center">
            <HiOutlineChartBarSquare className="w-10 h-10 text-surface-600 mx-auto mb-2" />
            <p className="text-surface-500 text-sm">No results yet. Take a test to see your scores!</p>
          </div>
        ) : (
          <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-800/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">Test</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">Score</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">%</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/30">
                  {results.slice(0, 5).map((r) => {
                    const pass = (r.percentage || 0) >= 40;
                    return (
                      <tr key={r._id} className="hover:bg-surface-800/20 transition-colors cursor-pointer" onClick={() => navigate(`/student/results/${r._id}`)}>
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-surface-200">{r.testId?.title || 'N/A'}</p>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-sm font-bold ${pass ? 'text-emerald-400' : 'text-red-400'}`}>
                            {r.score}/{r.totalMarks}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                            pass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {r.percentage}%
                          </span>
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <span className="text-xs text-surface-500">{formatDate(r.submittedAt)}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <HiOutlineArrowRight className="w-4 h-4 text-surface-600" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
