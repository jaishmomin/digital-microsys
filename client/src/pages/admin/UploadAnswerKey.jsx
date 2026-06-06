import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineKey,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';

const UploadAnswerKey = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [testTitle, setTestTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bulkOption, setBulkOption] = useState('');

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const [testRes, qRes] = await Promise.all([
        API.get(`/tests/${id}`),
        API.get(`/tests/${id}/questions`),
      ]);

      setTestTitle(testRes.data.data.title);
      setQuestions(qRes.data.data);

      // Load existing answer key if any
      try {
        const akRes = await API.get(`/tests/${id}/answerkey`);
        const existingAnswers = {};
        akRes.data.data.answers.forEach((a) => {
          existingAnswers[a.questionNo] = a.correctOption;
        });
        setAnswers(existingAnswers);
      } catch {
        // No answer key yet
      }
    } catch (err) {
      toast.error('Failed to load test data');
      navigate('/admin/tests');
    } finally {
      setLoading(false);
    }
  };

  const setAnswer = (questionNo, option) => {
    setAnswers((prev) => ({ ...prev, [questionNo]: option }));
    setSaved(false);
  };

  const handleBulkFill = () => {
    if (!bulkOption) return;
    const filled = {};
    questions.forEach((q) => { filled[q.questionNo] = bulkOption; });
    setAnswers(filled);
    setSaved(false);
    toast.success(`All answers set to ${bulkOption}`);
  };

  const handleSubmit = async () => {
    // Validate all questions have answers
    const missing = questions.filter((q) => !answers[q.questionNo]);
    if (missing.length > 0) {
      return toast.error(`${missing.length} question(s) don't have answers selected`);
    }

    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({
        questionNo: q.questionNo,
        correctOption: answers[q.questionNo],
      }));

      await API.post(`/tests/${id}/answerkey`, { answers: payload });
      toast.success('Answer key saved successfully!');
      setSaved(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save answer key');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const answeredCount = questions.filter((q) => answers[q.questionNo]).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/tests')} className="p-2 rounded-xl hover:bg-surface-800/50 text-surface-400 hover:text-surface-200 transition-colors cursor-pointer">
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-surface-100">Answer Key</h1>
          <p className="text-surface-500 text-sm mt-0.5">{testTitle} · {answeredCount}/{questions.length} answered</p>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl p-12 text-center">
          <HiOutlineKey className="w-12 h-12 text-surface-600 mx-auto mb-3" />
          <p className="text-surface-400 text-sm">No questions found for this test.</p>
          <p className="text-surface-500 text-xs mt-1">Add questions first, then set the answer key.</p>
          <button onClick={() => navigate(`/admin/tests/${id}/questions`)}
            className="mt-4 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl text-sm font-medium hover:bg-amber-500/30 transition-colors cursor-pointer">
            Add Questions
          </button>
        </div>
      ) : (
        <>
          {/* Bulk Fill */}
          <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <p className="text-sm font-medium text-surface-300">Bulk Fill:</p>
              <div className="flex gap-2">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <button key={opt} onClick={() => setBulkOption(opt)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      bulkOption === opt
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                        : 'bg-surface-800/50 text-surface-400 hover:bg-surface-700/50 border border-surface-700/50'
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>
              <button onClick={handleBulkFill} disabled={!bulkOption}
                className="px-4 py-2 bg-surface-800/50 hover:bg-surface-700/50 border border-surface-700/50 text-surface-300 hover:text-surface-100 rounded-xl text-sm font-medium transition-all disabled:opacity-40 cursor-pointer">
                Apply to All
              </button>
            </div>
          </div>

          {/* Answer Grid */}
          <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl p-6">
            <div className="space-y-3">
              {questions.map((q) => (
                <div key={q._id} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-surface-800/20 hover:bg-surface-800/40 transition-colors">
                  <span className="w-12 text-sm font-bold text-surface-400 shrink-0">Q{q.questionNo}</span>
                  <p className="flex-1 text-sm text-surface-300 truncate min-w-0">{q.questionText}</p>
                  <div className="flex gap-1.5 shrink-0">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <button key={opt} onClick={() => setAnswer(q.questionNo, opt)}
                        className={`w-9 h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          answers[q.questionNo] === opt
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                            : 'bg-surface-700/50 text-surface-400 hover:bg-surface-600/50 border border-surface-700/50'
                        }`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/25 text-sm disabled:opacity-50 cursor-pointer">
              <HiOutlineKey className="w-4 h-4" />
              {submitting ? 'Saving...' : 'Save Answer Key'}
            </button>

            {saved && (
              <div className="flex items-center gap-2 text-emerald-400 animate-fade-in">
                <HiOutlineCheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Answer key saved!</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UploadAnswerKey;
