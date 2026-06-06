import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft } from 'react-icons/hi2';

const EditTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', subject: '',
    startTime: '', endTime: '', duration: 60,
    maxAttempts: 1, negativeMarking: false,
    marksPerQuestion: 1, negativeMarks: 0.25, status: 'draft',
  });

  useEffect(() => { fetchTest(); }, [id]);

  const fetchTest = async () => {
    try {
      const res = await API.get(`/tests/${id}`);
      const t = res.data.data;
      setForm({
        title: t.title || '',
        description: t.description || '',
        subject: t.subject || '',
        startTime: t.startTime ? new Date(t.startTime).toISOString().slice(0, 16) : '',
        endTime: t.endTime ? new Date(t.endTime).toISOString().slice(0, 16) : '',
        duration: t.duration || 60,
        maxAttempts: t.maxAttempts || 1,
        negativeMarking: t.negativeMarking || false,
        marksPerQuestion: t.marksPerQuestion || 1,
        negativeMarks: t.negativeMarks || 0.25,
        status: t.status || 'draft',
      });
    } catch (err) {
      toast.error('Failed to load test');
      navigate('/admin/tests');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration: Number(form.duration),
        maxAttempts: Number(form.maxAttempts),
        marksPerQuestion: Number(form.marksPerQuestion),
        negativeMarks: form.negativeMarking ? Number(form.negativeMarks) : 0,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
      };
      await API.put(`/tests/${id}`, payload);
      toast.success('Test updated!');
      navigate('/admin/tests');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      await API.put(`/tests/${id}/publish`);
      toast.success('Test published!');
      navigate('/admin/tests');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot publish');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/tests')} className="p-2 rounded-xl hover:bg-surface-800/50 text-surface-400 hover:text-surface-200 transition-colors cursor-pointer">
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-surface-100">Edit Test</h1>
          <p className="text-surface-500 text-sm mt-0.5">Update test configuration</p>
        </div>
        {form.status === 'draft' && (
          <button onClick={handlePublish}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer">
            Publish
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label htmlFor="et-title" className="block text-sm font-medium text-surface-300 mb-1.5">Test Title *</label>
            <input id="et-title" name="title" value={form.title} onChange={handleChange} required
              className="w-full px-4 py-3 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="et-desc" className="block text-sm font-medium text-surface-300 mb-1.5">Description</label>
            <textarea id="et-desc" name="description" value={form.description} onChange={handleChange} rows={3}
              className="w-full px-4 py-3 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm resize-none" />
          </div>
          <div>
            <label htmlFor="et-subject" className="block text-sm font-medium text-surface-300 mb-1.5">Subject</label>
            <input id="et-subject" name="subject" value={form.subject} onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm" />
          </div>
          <div>
            <label htmlFor="et-status" className="block text-sm font-medium text-surface-300 mb-1.5">Status</label>
            <select id="et-status" name="status" value={form.status} onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="border-t border-surface-800/50" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="et-start" className="block text-sm font-medium text-surface-400 mb-1.5">Start Time</label>
            <input id="et-start" name="startTime" type="datetime-local" value={form.startTime} onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm" />
          </div>
          <div>
            <label htmlFor="et-end" className="block text-sm font-medium text-surface-400 mb-1.5">End Time</label>
            <input id="et-end" name="endTime" type="datetime-local" value={form.endTime} onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm" />
          </div>
        </div>

        <div className="border-t border-surface-800/50" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label htmlFor="et-dur" className="block text-sm font-medium text-surface-400 mb-1.5">Duration (min)</label>
            <input id="et-dur" name="duration" type="number" min="1" value={form.duration} onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm" />
          </div>
          <div>
            <label htmlFor="et-att" className="block text-sm font-medium text-surface-400 mb-1.5">Max Attempts</label>
            <input id="et-att" name="maxAttempts" type="number" min="1" value={form.maxAttempts} onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm" />
          </div>
          <div>
            <label htmlFor="et-mpq" className="block text-sm font-medium text-surface-400 mb-1.5">Marks/Question</label>
            <input id="et-mpq" name="marksPerQuestion" type="number" min="0" step="0.5" value={form.marksPerQuestion} onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm" />
          </div>
        </div>

        {/* Negative Marking */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-surface-800/30 border border-surface-700/30">
          <label className="flex items-center gap-3 cursor-pointer flex-1">
            <div className="relative">
              <input type="checkbox" name="negativeMarking" checked={form.negativeMarking} onChange={handleChange} className="sr-only peer" />
              <div className="w-10 h-6 bg-surface-700 rounded-full peer-checked:bg-amber-500 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
            </div>
            <span className="text-sm font-medium text-surface-200">Negative Marking</span>
          </label>
          {form.negativeMarking && (
            <div className="sm:w-40">
              <input name="negativeMarks" type="number" min="0" step="0.25" value={form.negativeMarks} onChange={handleChange}
                className="w-full px-3 py-2 bg-surface-800/50 border border-surface-700/50 rounded-lg text-surface-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/25 text-sm disabled:opacity-50 cursor-pointer">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate('/admin/tests')}
            className="px-6 py-3 text-surface-400 hover:text-surface-200 font-medium text-sm transition-colors cursor-pointer">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditTest;
