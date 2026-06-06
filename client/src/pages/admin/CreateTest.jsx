import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineArrowLeft,
} from 'react-icons/hi2';

const CreateTest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    startTime: '',
    endTime: '',
    duration: 60,
    maxAttempts: 1,
    negativeMarking: false,
    marksPerQuestion: 1,
    negativeMarks: 0.25,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.duration || form.duration < 1) return toast.error('Duration must be at least 1 minute');

    setLoading(true);
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
      const res = await API.post('/tests', payload);
      toast.success('Test created successfully!');
      navigate(`/admin/tests/${res.data.data._id}/questions`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/tests')} className="p-2 rounded-xl hover:bg-surface-800/50 text-surface-400 hover:text-surface-200 transition-colors cursor-pointer">
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Create New Test</h1>
          <p className="text-surface-500 text-sm mt-0.5">Set up test details, then add questions</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl p-6 lg:p-8 space-y-6">
        {/* Title & Subject */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label htmlFor="ct-title" className="block text-sm font-medium text-surface-300 mb-1.5">Test Title *</label>
            <input id="ct-title" name="title" value={form.title} onChange={handleChange} required
              className="w-full px-4 py-3 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm"
              placeholder="e.g. Data Structures Mid-Term 2025" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="ct-desc" className="block text-sm font-medium text-surface-300 mb-1.5">Description</label>
            <textarea id="ct-desc" name="description" value={form.description} onChange={handleChange} rows={3}
              className="w-full px-4 py-3 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm resize-none"
              placeholder="Brief description of the test (optional)" />
          </div>
          <div>
            <label htmlFor="ct-subject" className="block text-sm font-medium text-surface-300 mb-1.5">Subject</label>
            <input id="ct-subject" name="subject" value={form.subject} onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm"
              placeholder="e.g. Computer Science" />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-surface-800/50" />

        {/* Date/Time */}
        <div>
          <h3 className="text-sm font-semibold text-surface-300 mb-4">Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="ct-start" className="block text-sm font-medium text-surface-400 mb-1.5">Start Time</label>
              <input id="ct-start" name="startTime" type="datetime-local" value={form.startTime} onChange={handleChange}
                className="w-full px-4 py-3 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm" />
            </div>
            <div>
              <label htmlFor="ct-end" className="block text-sm font-medium text-surface-400 mb-1.5">End Time</label>
              <input id="ct-end" name="endTime" type="datetime-local" value={form.endTime} onChange={handleChange}
                className="w-full px-4 py-3 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm" />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-surface-800/50" />

        {/* Settings */}
        <div>
          <h3 className="text-sm font-semibold text-surface-300 mb-4">Test Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label htmlFor="ct-dur" className="block text-sm font-medium text-surface-400 mb-1.5">Duration (minutes) *</label>
              <input id="ct-dur" name="duration" type="number" min="1" value={form.duration} onChange={handleChange} required
                className="w-full px-4 py-3 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm" />
            </div>
            <div>
              <label htmlFor="ct-attempts" className="block text-sm font-medium text-surface-400 mb-1.5">Max Attempts</label>
              <input id="ct-attempts" name="maxAttempts" type="number" min="1" value={form.maxAttempts} onChange={handleChange}
                className="w-full px-4 py-3 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm" />
            </div>
            <div>
              <label htmlFor="ct-mpq" className="block text-sm font-medium text-surface-400 mb-1.5">Marks per Question</label>
              <input id="ct-mpq" name="marksPerQuestion" type="number" min="0" step="0.5" value={form.marksPerQuestion} onChange={handleChange}
                className="w-full px-4 py-3 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm" />
            </div>
          </div>
        </div>

        {/* Negative Marking */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-surface-800/30 border border-surface-700/30">
          <label className="flex items-center gap-3 cursor-pointer flex-1">
            <div className="relative">
              <input type="checkbox" name="negativeMarking" checked={form.negativeMarking} onChange={handleChange}
                className="sr-only peer" />
              <div className="w-10 h-6 bg-surface-700 rounded-full peer-checked:bg-amber-500 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-200">Negative Marking</p>
              <p className="text-xs text-surface-500">Deduct marks for wrong answers</p>
            </div>
          </label>
          {form.negativeMarking && (
            <div className="sm:w-40">
              <label htmlFor="ct-neg" className="block text-xs font-medium text-surface-400 mb-1">Negative marks</label>
              <input id="ct-neg" name="negativeMarks" type="number" min="0" step="0.25" value={form.negativeMarks} onChange={handleChange}
                className="w-full px-3 py-2 bg-surface-800/50 border border-surface-700/50 rounded-lg text-surface-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm" />
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/25 text-sm disabled:opacity-50 cursor-pointer">
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              <>
                <HiOutlineClipboardDocumentList className="w-4 h-4" />
                Create Test & Add Questions
              </>
            )}
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

export default CreateTest;
