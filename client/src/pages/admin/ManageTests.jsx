import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import {
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineDocumentText,
  HiOutlineKey,
  HiOutlineChartBarSquare,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

const ManageTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '' });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await API.get('/tests');
      setTests(res.data.data);
    } catch (err) {
      toast.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (id, title) => setDeleteModal({ open: true, id, title });
  const closeDeleteModal = () => setDeleteModal({ open: false, id: null, title: '' });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await API.delete(`/tests/${deleteModal.id}`);
      toast.success('Test deleted');
      setTests(tests.filter((t) => t._id !== deleteModal.id));
      closeDeleteModal();
    } catch (err) {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const getTestStatus = (test) => {
    const now = new Date();
    const start = test.startTime ? new Date(test.startTime) : null;
    const end = test.endTime ? new Date(test.endTime) : null;

    if (test.status === 'draft') return { label: 'Draft', color: 'bg-surface-700/50 text-surface-400' };
    if (start && end && now >= start && now <= end) return { label: 'Live', color: 'bg-emerald-500/20 text-emerald-400' };
    if (start && now < start) return { label: 'Upcoming', color: 'bg-blue-500/20 text-blue-400' };
    if (end && now > end) return { label: 'Ended', color: 'bg-surface-700/30 text-surface-500' };
    if (test.status === 'published') return { label: 'Published', color: 'bg-amber-500/20 text-amber-400' };
    return { label: test.status, color: 'bg-surface-700/30 text-surface-500' };
  };

  const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  const filtered = tests.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.subject?.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Manage Tests</h1>
          <p className="text-surface-500 text-sm mt-1">{tests.length} test{tests.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link
          to="/admin/tests/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/25 text-sm w-fit"
        >
          <HiOutlinePlus className="w-4 h-4" /> Create Test
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tests..."
          className="w-full pl-10 pr-4 py-2.5 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-200 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-800/50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider">Test Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider hidden md:table-cell">Start / End</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider hidden sm:table-cell">Duration</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider hidden lg:table-cell">Qs</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/30">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-surface-600 text-sm">
                    {search ? 'No tests match your search' : 'No tests created yet'}
                  </td>
                </tr>
              ) : (
                filtered.map((test) => {
                  const status = getTestStatus(test);
                  return (
                    <tr key={test._id} className="hover:bg-surface-800/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-surface-200">{test.title}</p>
                        <p className="text-xs text-surface-500">{test.subject}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <p className="text-xs text-surface-400">{formatDateTime(test.startTime)}</p>
                        <p className="text-xs text-surface-500">{formatDateTime(test.endTime)}</p>
                      </td>
                      <td className="px-5 py-3.5 text-center hidden sm:table-cell">
                        <span className="text-sm text-surface-300">{test.duration}m</span>
                      </td>
                      <td className="px-5 py-3.5 text-center hidden lg:table-cell">
                        <span className="text-sm text-surface-300">{test.questionCount || 0}</span>
                        {test.hasAnswerKey && <span className="ml-1 text-emerald-400 text-xs">✓</span>}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/admin/tests/${test._id}/edit`} title="Edit" className="p-2 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-amber-400 transition-colors">
                            <HiOutlinePencilSquare className="w-4 h-4" />
                          </Link>
                          <Link to={`/admin/tests/${test._id}/questions`} title="Questions" className="p-2 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-blue-400 transition-colors">
                            <HiOutlineDocumentText className="w-4 h-4" />
                          </Link>
                          <Link to={`/admin/tests/${test._id}/answerkey`} title="Answer Key" className="p-2 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-emerald-400 transition-colors">
                            <HiOutlineKey className="w-4 h-4" />
                          </Link>
                          <Link to={`/admin/results?testId=${test._id}`} title="Results" className="p-2 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-purple-400 transition-colors">
                            <HiOutlineChartBarSquare className="w-4 h-4" />
                          </Link>
                          <button onClick={() => openDeleteModal(test._id, test.title)} title="Delete" className="p-2 rounded-lg hover:bg-red-500/10 text-surface-400 hover:text-red-400 transition-colors cursor-pointer">
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Delete Test?"
        message={`Are you sure you want to delete "${deleteModal.title}"? This will permanently delete all questions, answer keys, and results for this test.`}
        confirmText="Delete Test"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default ManageTests;
