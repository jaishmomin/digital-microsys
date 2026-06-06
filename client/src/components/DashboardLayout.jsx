import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineClipboardDocumentList,
  HiOutlineChartBarSquare,
  HiOutlineUsers,
  HiOutlineArrowRightOnRectangle,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineAcademicCap,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate(isAdmin ? '/admin/login' : '/login');
  };

  // Admin navigation
  const adminNav = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: HiOutlineHome },
    { path: '/admin/tests', label: 'Manage Tests', icon: HiOutlineClipboardDocumentList },
    { path: '/admin/students', label: 'Manage Students', icon: HiOutlineUsers },
    { path: '/admin/results', label: 'View Results', icon: HiOutlineChartBarSquare },
  ];

  // Student navigation
  const studentNav = [
    { path: '/student/dashboard', label: 'Dashboard', icon: HiOutlineHome },
    { path: '/student/results', label: 'My Results', icon: HiOutlineChartBarSquare },
  ];

  const navItems = isAdmin ? adminNav : studentNav;

  const isActive = (path) => {
    if (path === '/admin/tests' && location.pathname.startsWith('/admin/tests')) return true;
    if (path === '/admin/results' && location.pathname.startsWith('/admin/results')) return true;
    if (path === '/student/results' && location.pathname.startsWith('/student/results')) return true;
    return location.pathname === path;
  };

  // Admin accent = amber, Student accent = primary
  const accentRing = isAdmin ? 'focus:ring-amber-500/50' : 'focus:ring-primary-500/50';
  const brandGradient = isAdmin
    ? 'from-amber-500 to-amber-700'
    : 'from-primary-500 to-primary-700';
  const brandShadow = isAdmin
    ? 'shadow-amber-500/20'
    : 'shadow-primary-500/20';
  const activeClass = isAdmin
    ? 'bg-amber-500/15 text-amber-400'
    : 'bg-primary-500/15 text-primary-400';
  const activeDot = isAdmin ? 'bg-amber-400' : 'bg-primary-400';
  const activeIcon = isAdmin
    ? 'text-amber-400'
    : 'text-primary-400';

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[280px] bg-surface-900/80 backdrop-blur-xl border-r border-surface-800/50 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-surface-800/50">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${brandGradient} flex items-center justify-center shadow-lg ${brandShadow}`}>
            {isAdmin ? (
              <HiOutlineShieldCheck className="w-5 h-5 text-white" />
            ) : (
              <HiOutlineAcademicCap className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-sm font-bold text-surface-100 tracking-tight">Digital Microsys</h1>
            <p className="text-[10px] text-surface-500 uppercase tracking-widest">
              {isAdmin ? 'Admin Panel' : 'Test Management'}
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-surface-400 hover:text-surface-200 transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active
                    ? `${activeClass} shadow-sm`
                    : 'text-surface-400 hover:bg-surface-800/60 hover:text-surface-200'
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${active ? activeIcon : 'text-surface-500 group-hover:text-surface-300'}`} />
                {item.label}
                {active && (
                  <div className={`ml-auto w-1.5 h-1.5 rounded-full ${activeDot}`} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-surface-800/50">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${brandGradient} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-surface-200 truncate">{user?.name}</p>
              <p className="text-xs text-surface-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
          >
            <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-surface-900/50 backdrop-blur-lg border-b border-surface-800/50 flex items-center px-4 lg:px-8 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-surface-400 hover:text-surface-200 transition-colors mr-4"
          >
            <HiOutlineBars3 className="w-6 h-6" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-surface-500 hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isAdmin ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {user?.role}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
