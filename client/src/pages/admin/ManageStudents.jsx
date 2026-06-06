import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineChartBarSquare,
} from 'react-icons/hi2';

const ManageStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState(null);
  const [toggleModal, setToggleModal] = useState({ open: false, student: null });

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async (query = '') => {
    try {
      const res = await API.get(`/users/students${query ? `?search=${query}` : ''}`);
      setStudents(res.data.data);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (val) => {
    setSearch(val);
    if (val.length >= 2 || val.length === 0) {
      fetchStudents(val);
    }
  };

  const openToggleModal = (student) => setToggleModal({ open: true, student });
  const closeToggleModal = () => setToggleModal({ open: false, student: null });

  const handleToggle = async () => {
    const id = toggleModal.student?._id;
    if (!id) return;
    setToggling(id);
    try {
      const res = await API.put(`/users/${id}/toggle-active`);
      setStudents((prev) =>
        prev.map((s) => (s._id === id ? { ...s, isActive: res.data.data.isActive } : s))
      );
      toast.success(res.data.message);
      closeToggleModal();
    } catch (err) {
      toast.error('Toggle failed');
    } finally {
      setToggling(null);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Manage Students</h1>
        <p className="text-surface-500 text-sm mt-1">{students.length} student{students.length !== 1 ? 's' : ''} registered</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name or roll number..."
          className="w-full pl-10 pr-4 py-2.5 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-200 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-800/50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider">Roll No</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider hidden md:table-cell">Joined</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/30">
              {students.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-surface-600 text-sm">
                    {search ? 'No students match your search' : 'No students registered yet'}
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s._id} className="hover:bg-surface-800/20 transition-colors cursor-pointer" onClick={() => navigate(`/admin/results?studentId=${s._id}`)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {s.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-surface-200">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="text-sm text-surface-400">{s.email}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-surface-300 font-mono">{s.rollNumber}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openToggleModal(s)}
                        className="cursor-pointer"
                        title={s.isActive ? 'Click to disable' : 'Click to enable'}
                      >
                        <div className="relative inline-block">
                          <div className={`w-10 h-6 rounded-full transition-colors ${s.isActive ? 'bg-emerald-500' : 'bg-surface-700'}`} />
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${s.isActive ? 'translate-x-4' : ''}`} />
                        </div>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-xs text-surface-500">{formatDate(s.createdAt)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => navigate(`/admin/results?studentId=${s._id}`)} title="View Results"
                        className="p-2 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-amber-400 transition-colors cursor-pointer">
                        <HiOutlineChartBarSquare className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toggle Confirm Modal */}
      <ConfirmModal
        isOpen={toggleModal.open}
        onClose={closeToggleModal}
        onConfirm={handleToggle}
        title={toggleModal.student?.isActive ? 'Disable Student?' : 'Enable Student?'}
        message={
          toggleModal.student?.isActive
            ? `Disable ${toggleModal.student?.name}? They won't be able to login or take tests.`
            : `Enable ${toggleModal.student?.name}? They will regain access to login and take tests.`
        }
        confirmText={toggleModal.student?.isActive ? 'Disable' : 'Enable'}
        variant={toggleModal.student?.isActive ? 'warning' : 'info'}
        loading={toggling === toggleModal.student?._id}
      />
    </div>
  );
};

export default ManageStudents;
