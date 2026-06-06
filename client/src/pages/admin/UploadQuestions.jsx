import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineArrowUpTray,
  HiOutlineArrowDownTray,
  HiOutlineDocumentText,
  HiOutlineTableCells,
} from 'react-icons/hi2';

const UploadQuestions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [testTitle, setTestTitle] = useState('');
  const [activeTab, setActiveTab] = useState('manual');
  const [existing, setExisting] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Manual entry state
  const emptyQ = { questionNo: '', questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', marks: 1 };
  const [questions, setQuestions] = useState([{ ...emptyQ }]);

  // CSV state
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvUploading, setCsvUploading] = useState(false);

  useEffect(() => { fetchExisting(); }, [id]);

  const fetchExisting = async () => {
    try {
      const [testRes, qRes] = await Promise.all([
        API.get(`/tests/${id}`),
        API.get(`/tests/${id}/questions`),
      ]);
      setTestTitle(testRes.data.data.title);
      setExisting(qRes.data.data);
    } catch (err) {
      toast.error('Failed to load test');
      navigate('/admin/tests');
    } finally {
      setLoading(false);
    }
  };

  // --- Manual Entry ---
  const updateQuestion = (idx, field, value) => {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const addQuestion = () => setQuestions((prev) => [...prev, { ...emptyQ }]);

  const removeQuestion = (idx) => {
    if (questions.length === 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleManualSubmit = async () => {
    const valid = questions.every((q) => q.questionText && q.optionA && q.optionB && q.optionC && q.optionD);
    if (!valid) return toast.error('All question fields are required');

    setSubmitting(true);
    try {
      const payload = questions.map((q, idx) => ({
        ...q,
        questionNo: q.questionNo ? Number(q.questionNo) : (existing.length + idx + 1),
        marks: Number(q.marks) || 1,
      }));
      const res = await API.post(`/tests/${id}/questions`, { questions: payload });
      toast.success(res.data.message);
      setQuestions([{ ...emptyQ }]);
      fetchExisting();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add questions');
    } finally {
      setSubmitting(false);
    }
  };

  // --- CSV ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);

    // Local preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) { setCsvPreview([]); return; }
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(',').map((v) => v.trim());
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
        return obj;
      });
      setCsvPreview(rows.slice(0, 20));
    };
    reader.readAsText(file);
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return toast.error('Select a CSV file first');
    setCsvUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      const res = await API.post(`/tests/${id}/questions/csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message);
      setCsvFile(null);
      setCsvPreview([]);
      if (fileRef.current) fileRef.current.value = '';
      fetchExisting();
    } catch (err) {
      toast.error(err.response?.data?.message || 'CSV upload failed');
    } finally {
      setCsvUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    const csv = 'questionNo,questionText,optionA,optionB,optionC,optionD,marks\n1,What is 2+2?,3,4,5,6,1\n2,Capital of India?,Mumbai,Delhi,Chennai,Kolkata,1';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sample_questions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/tests')} className="p-2 rounded-xl hover:bg-surface-800/50 text-surface-400 hover:text-surface-200 transition-colors cursor-pointer">
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Upload Questions</h1>
          <p className="text-surface-500 text-sm mt-0.5">{testTitle} · {existing.length} question{existing.length !== 1 ? 's' : ''} added</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-900/60 border border-surface-800/50 rounded-xl p-1 w-fit">
        <button onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === 'manual' ? 'bg-amber-500/20 text-amber-400' : 'text-surface-400 hover:text-surface-200'}`}>
          <HiOutlineDocumentText className="w-4 h-4" /> Manual Entry
        </button>
        <button onClick={() => setActiveTab('csv')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === 'csv' ? 'bg-amber-500/20 text-amber-400' : 'text-surface-400 hover:text-surface-200'}`}>
          <HiOutlineTableCells className="w-4 h-4" /> CSV Upload
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'manual' ? (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={idx} className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-surface-300">Question {idx + 1}</h3>
                {questions.length > 1 && (
                  <button onClick={() => removeQuestion(idx)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-surface-500 hover:text-red-400 transition-colors cursor-pointer">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-surface-400 mb-1">Q.No</label>
                  <input type="number" value={q.questionNo} onChange={(e) => updateQuestion(idx, 'questionNo', e.target.value)} placeholder="Auto"
                    className="w-full px-3 py-2.5 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm" />
                </div>
                <div className="sm:col-span-8">
                  <label className="block text-xs font-medium text-surface-400 mb-1">Question Text *</label>
                  <input value={q.questionText} onChange={(e) => updateQuestion(idx, 'questionText', e.target.value)} required
                    className="w-full px-3 py-2.5 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm"
                    placeholder="Enter question text" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-surface-400 mb-1">Marks</label>
                  <input type="number" value={q.marks} onChange={(e) => updateQuestion(idx, 'marks', e.target.value)} min="0"
                    className="w-full px-3 py-2.5 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <div key={opt}>
                    <label className="block text-xs font-medium text-surface-400 mb-1">Option {opt} *</label>
                    <input value={q[`option${opt}`]} onChange={(e) => updateQuestion(idx, `option${opt}`, e.target.value)} required
                      className="w-full px-3 py-2.5 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm"
                      placeholder={`Option ${opt}`} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3">
            <button onClick={addQuestion}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-800/50 hover:bg-surface-700/50 border border-surface-700/50 text-surface-300 hover:text-surface-100 rounded-xl text-sm font-medium transition-all cursor-pointer">
              <HiOutlinePlus className="w-4 h-4" /> Add Another Question
            </button>
            <button onClick={handleManualSubmit} disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/25 text-sm disabled:opacity-50 cursor-pointer">
              {submitting ? 'Submitting...' : `Submit ${questions.length} Question${questions.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl p-6 space-y-6">
          {/* CSV Upload */}
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-surface-300 mb-2">Upload CSV File</label>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange}
                className="w-full text-sm text-surface-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-amber-500/20 file:text-amber-400 hover:file:bg-amber-500/30 file:cursor-pointer file:transition-colors" />
              <p className="text-xs text-surface-500 mt-2">CSV format: questionNo, questionText, optionA, optionB, optionC, optionD, marks</p>
            </div>
            <button onClick={downloadSampleCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-800/50 hover:bg-surface-700/50 border border-surface-700/50 text-surface-300 hover:text-surface-100 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap">
              <HiOutlineArrowDownTray className="w-4 h-4" /> Sample CSV
            </button>
          </div>

          {/* Preview */}
          {csvPreview.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-surface-300 mb-3">Preview ({csvPreview.length} rows)</h3>
              <div className="overflow-x-auto rounded-xl border border-surface-700/30">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-800/50">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-surface-400">#</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-surface-400">Question</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-surface-400">A</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-surface-400">B</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-surface-400">C</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-surface-400">D</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-800/20">
                    {csvPreview.map((row, i) => (
                      <tr key={i} className="hover:bg-surface-800/20">
                        <td className="px-3 py-2 text-surface-400">{row.questionno || i + 1}</td>
                        <td className="px-3 py-2 text-surface-200 max-w-xs truncate">{row.questiontext || row.question}</td>
                        <td className="px-3 py-2 text-surface-300">{row.optiona}</td>
                        <td className="px-3 py-2 text-surface-300">{row.optionb}</td>
                        <td className="px-3 py-2 text-surface-300">{row.optionc}</td>
                        <td className="px-3 py-2 text-surface-300">{row.optiond}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button onClick={handleCsvUpload} disabled={!csvFile || csvUploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/25 text-sm disabled:opacity-50 cursor-pointer">
            <HiOutlineArrowUpTray className="w-4 h-4" />
            {csvUploading ? 'Uploading...' : 'Confirm Upload'}
          </button>
        </div>
      )}

      {/* Existing Questions */}
      {existing.length > 0 && (
        <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-surface-200 mb-4">Existing Questions ({existing.length})</h2>
          <div className="overflow-x-auto rounded-xl border border-surface-700/30">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-800/50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-surface-400">#</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-surface-400">Question</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-surface-400">A</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-surface-400">B</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-surface-400">C</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-surface-400">D</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-surface-400">Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/20">
                {existing.map((q) => (
                  <tr key={q._id} className="hover:bg-surface-800/20">
                    <td className="px-3 py-2 text-surface-400 font-medium">{q.questionNo}</td>
                    <td className="px-3 py-2 text-surface-200 max-w-xs truncate">{q.questionText}</td>
                    <td className="px-3 py-2 text-surface-300 text-center text-xs">{q.optionA}</td>
                    <td className="px-3 py-2 text-surface-300 text-center text-xs">{q.optionB}</td>
                    <td className="px-3 py-2 text-surface-300 text-center text-xs">{q.optionC}</td>
                    <td className="px-3 py-2 text-surface-300 text-center text-xs">{q.optionD}</td>
                    <td className="px-3 py-2 text-surface-300 text-center">{q.marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadQuestions;
