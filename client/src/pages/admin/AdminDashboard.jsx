import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineUsers,
  HiOutlineChartBarSquare,
  HiOutlineSignal,
  HiOutlinePlus,
  HiOutlineArrowRight,
} from 'react-icons/hi2';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalTests: 0,
    totalStudents: 0,
    totalSubmissions: 0,
    liveTests: 0,
    recentTests: [],
    recentSubmissions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get('/tests/stats/dashboard');
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { label: 'Total Tests', value: stats.totalTests, icon: HiOutlineClipboardDocumentList, gradient: 'from-indigo-500 to-indigo-700', glow: 'shadow-indigo-500/20' },
    { label: 'Total Students', value: stats.totalStudents, icon: HiOutlineUsers, gradient: 'from-amber-500 to-amber-700', glow: 'shadow-amber-500/20' },
    { label: 'Total Submissions', value: stats.totalSubmissions, icon: HiOutlineChartBarSquare, gradient: 'from-emerald-500 to-emerald-700', glow: 'shadow-emerald-500/20' },
    { label: 'Live Tests', value: stats.liveTests, icon: HiOutlineSignal, gradient: 'from-rose-500 to-rose-700', glow: 'shadow-rose-500/20' },
  ];

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-surface-100">Admin Dashboard</h1>
          <p className="text-surface-500 mt-1 text-sm">Overview of your test management system</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin/tests/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/25 text-sm"
          >
            <HiOutlinePlus className="w-4 h-4" /> Create Test
          </Link>
          <Link
            to="/admin/students"
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-800/60 hover:bg-surface-700/60 border border-surface-700/50 text-surface-300 hover:text-surface-100 font-medium rounded-xl transition-all text-sm"
          >
            <HiOutlineUsers className="w-4 h-4" /> View Students
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl p-5 hover:border-surface-700/50 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">{card.label}</p>
                  <p className="text-3xl font-bold text-surface-100 mt-2">{card.value}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg ${card.glow} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tests */}
        <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-200">Recent Tests</h2>
            <Link to="/admin/tests" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
              View all <HiOutlineArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {stats.recentTests.length === 0 ? (
            <p className="text-surface-600 text-sm py-8 text-center">No tests created yet</p>
          ) : (
            <div className="space-y-2">
              {stats.recentTests.slice(0, 5).map((t) => (
                <div key={t._id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface-800/30 hover:bg-surface-800/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-surface-200 truncate">{t.title}</p>
                    <p className="text-xs text-surface-500">{formatDate(t.createdAt)}</p>
                  </div>
                  <span className={`ml-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    t.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
                    t.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                    t.status === 'draft' ? 'bg-surface-700/50 text-surface-400' :
                    'bg-surface-700/30 text-surface-500'
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-200">Recent Submissions</h2>
            <Link to="/admin/results" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
              View all <HiOutlineArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {stats.recentSubmissions.length === 0 ? (
            <p className="text-surface-600 text-sm py-8 text-center">No submissions yet</p>
          ) : (
            <div className="space-y-2">
              {stats.recentSubmissions.slice(0, 5).map((s) => (
                <div key={s._id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface-800/30 hover:bg-surface-800/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-surface-200 truncate">{s.studentId?.name || 'N/A'}</p>
                    <p className="text-xs text-surface-500">{s.testId?.title || 'N/A'} · {formatDate(s.submittedAt)}</p>
                  </div>
                  <div className="ml-3 text-right">
                    <p className={`text-sm font-bold ${s.percentage >= 40 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {s.percentage}%
                    </p>
                    {s.autoSubmitted && (
                      <span className="text-[10px] text-red-400 font-medium">AUTO</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
