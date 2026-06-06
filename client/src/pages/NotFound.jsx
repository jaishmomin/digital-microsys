import { Link } from 'react-router-dom';
import { HiOutlineAcademicCap, HiOutlineExclamationTriangle } from 'react-icons/hi2';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="text-center animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-surface-900/60 border border-surface-800/50 flex items-center justify-center">
          <HiOutlineExclamationTriangle className="w-10 h-10 text-warning" />
        </div>
        <h1 className="text-6xl font-bold text-surface-200 mb-2">404</h1>
        <p className="text-surface-500 mb-8">Page not found</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all"
        >
          <HiOutlineAcademicCap className="w-5 h-5" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
