import { useTheme } from '../../context/ThemeContext';
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
  const { theme } = useTheme();
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-hover)', borderTopColor: 'var(--accent-amber)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '28px'
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Manage Students
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            {students.length} student{students.length !== 1 ? 's' : ''} registered
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or roll number..."
            style={{
              width: '100%',
              padding: '10px 16px 10px 42px',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-input)',
              borderRadius: '10px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <span style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
            display: 'flex'
          }}>
            <HiOutlineMagnifyingGlass size={16} />
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: '16px',
        padding: '0',
        overflow: 'hidden',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left' }} className="hidden sm:table-cell">Email</th>
                <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left' }}>Roll No</th>
                <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left' }} className="hidden md:table-cell">Joined</th>
                <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: '15px' }}>
                    {search ? 'No students match your search' : 'No students registered yet'}
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s._id} style={{ borderBottom: '1px solid var(--bg-hover)', transition: 'background 0.15s', cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/results?studentId=${s._id}`)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px', height: '36px',
                          borderRadius: '50%',
                          background: 'var(--accent-blue)',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px', fontWeight: '600',
                          color: 'var(--text-primary)', flexShrink: 0
                        }}>
                          {s.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-primary)' }} className="hidden sm:table-cell">
                      <span style={{ color: 'var(--text-secondary)' }}>{s.email}</span>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-primary)' }}>
                      <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{s.rollNumber}</span>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-primary)', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openToggleModal(s)}
                        style={{ cursor: 'pointer', background: 'none', border: 'none', margin: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
                        title={s.isActive ? 'Click to disable' : 'Click to enable'}
                      >
                        <div style={{ position: 'relative', width: '40px', height: '24px' }}>
                          <div style={{
                            width: '40px', height: '24px', borderRadius: '24px',
                            background: s.isActive ? 'var(--accent-green)' : 'var(--border-input)',
                            transition: '0.2s'
                          }} />
                          <div style={{
                            position: 'absolute', top: '2px', left: s.isActive ? '18px' : '2px',
                            width: '20px', height: '20px', background: 'var(--text-primary)', borderRadius: '50%',
                            transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                          }} />
                        </div>
                      </button>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-primary)' }} className="hidden md:table-cell">
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{formatDate(s.createdAt)}</span>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-primary)', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button onClick={() => navigate(`/admin/results?studentId=${s._id}`)} title="View Results"
                          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '7px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border-input)'; e.currentTarget.style.color = 'var(--accent-amber)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                          <HiOutlineChartBarSquare size={16} />
                        </button>
                      </div>
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
