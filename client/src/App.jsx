import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Shared
import Dashboard from './pages/Dashboard';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageTests from './pages/admin/ManageTests';
import CreateTest from './pages/admin/CreateTest';
import EditTest from './pages/admin/EditTest';
import UploadQuestions from './pages/admin/UploadQuestions';
import UploadAnswerKey from './pages/admin/UploadAnswerKey';
import ManageStudents from './pages/admin/ManageStudents';
import ViewResults from './pages/admin/ViewResults';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import TakeTest from './pages/student/TakeTest';
import MyResults from './pages/student/MyResults';
import ResultDetail from './pages/student/ResultDetail';

const App = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-surface-500 text-sm">Loading Digital Microsys...</p>
        </div>
      </div>
    );
  }

  // Redirect helper based on role
  const getDefaultRoute = () => {
    if (!isAuthenticated) return '/login';
    return user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <Login />}
      />
      <Route
        path="/admin/login"
        element={isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <AdminLogin />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <Register />}
      />

      {/* Protected: Admin-only routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/tests" element={<ManageTests />} />
          <Route path="/admin/tests/create" element={<CreateTest />} />
          <Route path="/admin/tests/:id/edit" element={<EditTest />} />
          <Route path="/admin/tests/:id/questions" element={<UploadQuestions />} />
          <Route path="/admin/tests/:id/answerkey" element={<UploadAnswerKey />} />
          <Route path="/admin/students" element={<ManageStudents />} />
          <Route path="/admin/results" element={<ViewResults />} />
        </Route>
      </Route>

      {/* Protected: Student-only routes */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/results" element={<MyResults />} />
          <Route path="/student/results/:id" element={<ResultDetail />} />
        </Route>
        {/* TakeTest is fullscreen — no DashboardLayout */}
        <Route path="/student/test/:id" element={<TakeTest />} />
      </Route>

      {/* Legacy /dashboard redirect */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
