import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../services/api';
import toast from 'react-hot-toast';
import ResultSummary from '../../components/ResultSummary';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowDownTray,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineMinusCircle,
  HiOutlineShieldExclamation,
} from 'react-icons/hi2';

const ResultDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => { fetchResult(); }, [id]);

  const fetchResult = async () => {
    try {
      const res = await API.get(`/student/results/${id}`);
      setResult(res.data.data);
    } catch (err) {
      toast.error('Failed to load result');
      navigate('/student/results');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const response = await API.get(
        `/student/results/${id}/pdf`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `result_${result?.studentId?.rollNumber || 'student'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF Downloaded!');
    } catch {
      toast.error('PDF download failed');
    } finally {
      setPdfLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '—';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!result) return null;

  const comparison = result.comparison || [];
  const violations = result.violationRecords || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/student/results')} className="p-2 rounded-xl hover:bg-surface-800/50 text-surface-400 hover:text-surface-200 transition-colors cursor-pointer">
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-surface-100">Result Detail</h1>
          <p className="text-surface-500 text-sm mt-0.5">{result.testId?.title}</p>
        </div>
        <button onClick={handleDownloadPDF} disabled={pdfLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 cursor-pointer">
          {pdfLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            <>
              <HiOutlineArrowDownTray className="w-4 h-4" /> Download PDF
            </>
          )}
        </button>
      </div>

      {/* Result Summary (reusable component) */}
      <ResultSummary result={result} />

      {/* Violations Section */}
      {violations.length > 0 && (
        <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-surface-300 mb-4 flex items-center gap-2">
            <HiOutlineShieldExclamation className="w-4 h-4 text-amber-400" />
            Violations ({violations.length})
          </h2>
          <div className="space-y-2">
            {violations.map((v, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <span className="text-sm text-amber-400 font-medium capitalize">{v.violationType?.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="text-xs text-surface-500">{formatDate(v.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answer Comparison */}
      <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-800/50">
          <h2 className="text-sm font-semibold text-surface-300">Answer Comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-800/50">
                <th className="text-center px-4 py-3 text-xs font-semibold text-surface-400 uppercase w-14">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Question</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-surface-400 uppercase w-20">Yours</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-surface-400 uppercase w-20">Correct</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-surface-400 uppercase w-16">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/20">
              {comparison.map((q) => (
                <tr key={q.questionNo} className={`${
                  q.isUnattempted ? 'bg-amber-500/3' : q.isCorrect ? 'bg-emerald-500/3' : 'bg-red-500/3'
                } hover:bg-surface-800/20 transition-colors`}>
                  <td className="px-4 py-3 text-center text-sm font-bold text-surface-400">{q.questionNo}</td>
                  <td className="px-4 py-3 text-sm text-surface-300 max-w-xs">
                    <p className="truncate">{q.questionText}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block w-8 h-8 rounded-lg text-xs font-bold leading-8 ${
                      q.isUnattempted ? 'bg-surface-700/50 text-surface-500'
                      : q.isCorrect ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                    }`}>
                      {q.studentAnswer || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold leading-8">
                      {q.correctAnswer}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {q.isUnattempted ? (
                      <HiOutlineMinusCircle className="w-5 h-5 text-amber-400 mx-auto" />
                    ) : q.isCorrect ? (
                      <HiOutlineCheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
                    ) : (
                      <HiOutlineXCircle className="w-5 h-5 text-red-400 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultDetail;
