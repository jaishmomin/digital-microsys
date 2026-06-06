import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowDownTray,
  HiOutlineFunnel,
  HiOutlineExclamationTriangle,
  HiOutlineChartBarSquare,
  HiOutlineTrophy,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineUserGroup,
} from 'react-icons/hi2';

// Blob download helper
const downloadBlob = (data, filename) => {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const ViewResults = () => {
  const [searchParams] = useSearchParams();
  const preTestId = searchParams.get('testId') || '';

  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(preTestId);
  const [results, setResults] = useState([]);
  const [testInfo, setTestInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [bulkExporting, setBulkExporting] = useState(false);
  const [rowExporting, setRowExporting] = useState(null); // resultId of row being exported

  useEffect(() => { fetchTests(); }, []);
  useEffect(() => { if (selectedTest) fetchResults(selectedTest); }, [selectedTest]);

  const fetchTests = async () => {
    try {
      const res = await API.get('/tests');
      setTests(res.data.data);
    } catch { toast.error('Failed to load tests'); }
    finally { setInitialLoading(false); }
  };

  const fetchResults = async (testId) => {
    setLoading(true);
    try {
      const res = await API.get(`/results/test/${testId}`);
      setResults(res.data.data.results);
      setTestInfo(res.data.data.test);
    } catch { toast.error('Failed to load results'); }
    finally { setLoading(false); }
  };

  // ─── Export All PDF ───
  const handleExportPDF = async () => {
    if (!selectedTest) return;
    setBulkExporting(true);
    try {
      const response = await API.get(`/results/test/${selectedTest}/export-pdf`, { responseType: 'blob' });
      downloadBlob(response.data, `results_${testInfo?.title?.replace(/\s+/g, '_') || 'test'}.pdf`);
      toast.success('PDF downloaded!');
    } catch { toast.error('PDF export failed'); }
    finally { setBulkExporting(false); }
  };

  // ─── Export Single Student PDF ───
  const handleExportSinglePDF = async (resultId, studentRoll) => {
    setRowExporting(resultId);
    try {
      const response = await API.get(`/results/${resultId}/export-pdf`, { responseType: 'blob' });
      downloadBlob(response.data, `result_${studentRoll || 'student'}.pdf`);
      toast.success('PDF downloaded!');
    } catch { toast.error('PDF export failed'); }
    finally { setRowExporting(null); }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  // ─── Stats calculation ───
  const passingPct = testInfo?.passingPercentage || 40;
  const scores = results.map((r) => r.percentage || 0);
  const passCount = scores.filter((s) => s >= passingPct).length;
  const failCount = scores.length - passCount;
  const highest = scores.length ? Math.max(...scores) : 0;
  const lowest = scores.length ? Math.min(...scores) : 0;
  const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  if (initialLoading) {
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
          <h1 className="text-2xl font-bold text-surface-100">View Results</h1>
          <p className="text-surface-500 text-sm mt-1">
            {testInfo ? `${testInfo.title} — ${results.length} submissions` : 'Select a test to view results'}
          </p>
        </div>
        {selectedTest && results.length > 0 && (
          <button onClick={handleExportPDF} disabled={bulkExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/25 text-sm w-fit disabled:opacity-50 cursor-pointer">
            {bulkExporting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exporting...
              </span>
            ) : (
              <>
                <HiOutlineArrowDownTray className="w-4 h-4" /> Export All PDF
              </>
            )}
          </button>
        )}
      </div>

      {/* Test Filter */}
      <div className="flex items-center gap-3">
        <HiOutlineFunnel className="w-4 h-4 text-surface-500" />
        <select value={selectedTest} onChange={(e) => setSelectedTest(e.target.value)}
          className="px-4 py-2.5 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm min-w-[250px]">
          <option value="">Select a test...</option>
          {tests.map((t) => (
            <option key={t._id} value={t._id}>{t.title} ({t.subject})</option>
          ))}
        </select>
      </div>

      {/* Stats Bar */}
      {selectedTest && results.length > 0 && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total', value: results.length, icon: HiOutlineUserGroup, color: 'text-blue-400', bg: 'bg-blue-500/15' },
            { label: 'Highest', value: `${highest}%`, icon: HiOutlineArrowTrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
            { label: 'Lowest', value: `${lowest}%`, icon: HiOutlineArrowTrendingDown, color: 'text-red-400', bg: 'bg-red-500/15' },
            { label: 'Average', value: `${average}%`, icon: HiOutlineChartBarSquare, color: 'text-amber-400', bg: 'bg-amber-500/15' },
            { label: 'Passed', value: passCount, icon: HiOutlineTrophy, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
            { label: 'Failed', value: failCount, icon: HiOutlineExclamationTriangle, color: 'text-red-400', bg: 'bg-red-500/15' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-surface-900/60 border border-surface-800/50 rounded-xl p-3 flex items-center gap-3">
                <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-lg font-bold text-surface-100 leading-tight">{s.value}</p>
                  <p className="text-[10px] text-surface-500 uppercase tracking-wider">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Results Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !selectedTest ? (
        <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl p-12 text-center">
          <HiOutlineFunnel className="w-10 h-10 text-surface-600 mx-auto mb-3" />
          <p className="text-surface-400 text-sm">Select a test from the dropdown above to view results</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl p-12 text-center">
          <p className="text-surface-400 text-sm">No submissions found for this test</p>
        </div>
      ) : (
        <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-800/50">
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider w-12">#</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider">Student</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider hidden sm:table-cell">Roll No</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider">Score</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider">%</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider hidden md:table-cell">Time</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider hidden lg:table-cell">Flags</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-surface-400 uppercase tracking-wider">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/30">
                {results.map((r, idx) => {
                  const pass = (r.percentage || 0) >= passingPct;
                  const isExporting = rowExporting === r._id;
                  return (
                    <tr key={r._id} className="hover:bg-surface-800/20 transition-colors">
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-xs font-bold text-surface-500">{idx + 1}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-surface-200">{r.studentId?.name || 'N/A'}</p>
                        <p className="text-xs text-surface-500 sm:hidden">{r.studentId?.rollNumber}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-sm text-surface-400 font-mono">{r.studentId?.rollNumber || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`text-sm font-bold ${pass ? 'text-emerald-400' : 'text-red-400'}`}>
                          {r.score}/{r.totalMarks}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          pass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {r.percentage}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center hidden md:table-cell">
                        <span className="text-xs text-surface-400">{formatTime(r.timeTaken)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center hidden lg:table-cell">
                        <div className="flex items-center justify-center gap-2">
                          {r.autoSubmitted && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold">
                              <HiOutlineExclamationTriangle className="w-3 h-3" /> AUTO
                            </span>
                          )}
                          {r.violationCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold">
                              {r.violationCount} violations
                            </span>
                          )}
                          {!r.autoSubmitted && !r.violationCount && (
                            <span className="text-xs text-surface-600">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handleExportSinglePDF(r._id, r.studentId?.rollNumber)}
                          disabled={isExporting}
                          className="p-2 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-amber-400 transition-colors cursor-pointer disabled:opacity-40"
                          title="Download PDF"
                        >
                          {isExporting ? (
                            <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                          ) : (
                            <HiOutlineArrowDownTray className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewResults;
