import { useState, useEffect, useReducer, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import toast from 'react-hot-toast';
import useTimer from '../../hooks/useTimer';
import useProctor from '../../hooks/useProctor';
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineFlag,
  HiOutlinePaperAirplane,
  HiOutlineClock,
  HiOutlineSignal,
  HiOutlineExclamationTriangle,
  HiOutlineXMark,
  HiOutlineListBullet,
} from 'react-icons/hi2';

// ─── Reducer ───
const initialState = {
  currentQuestion: 0,
  answers: {},
  flagged: [],
  visited: [0],
  testSubmitted: false,
};

function testReducer(state, action) {
  switch (action.type) {
    case 'SET_ANSWER': {
      const newAnswers = { ...state.answers };
      if (newAnswers[action.questionNo] === action.option) {
        delete newAnswers[action.questionNo]; // deselect
      } else {
        newAnswers[action.questionNo] = action.option;
      }
      return { ...state, answers: newAnswers };
    }
    case 'NAVIGATE': {
      const visited = state.visited.includes(action.index)
        ? state.visited
        : [...state.visited, action.index];
      return { ...state, currentQuestion: action.index, visited };
    }
    case 'TOGGLE_FLAG': {
      const flagged = state.flagged.includes(action.questionNo)
        ? state.flagged.filter((n) => n !== action.questionNo)
        : [...state.flagged, action.questionNo];
      return { ...state, flagged };
    }
    case 'SUBMITTED':
      return { ...state, testSubmitted: true };
    case 'RESTORE_ANSWERS':
      return { ...state, answers: action.answers };
    default:
      return state;
  }
}

// ─── Component ───
const TakeTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proctorActive, setProctorActive] = useState(false);

  const [state, dispatch] = useReducer(testReducer, initialState);
  const violationsRef = useRef([]);
  const startTimeRef = useRef(Date.now());
  const submittedRef = useRef(false);

  // ─── Fetch test data ───
  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await API.get(`/student/tests/${id}/start`);
        setTestData(res.data.data);
        startTimeRef.current = Date.now();

        // Restore answers from sessionStorage
        const saved = sessionStorage.getItem(`dms_test_${id}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            dispatch({ type: 'RESTORE_ANSWERS', answers: parsed });
          } catch { /* ignore */ }
        }

        // Activate proctor after data loads
        setTimeout(() => setProctorActive(true), 1000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load test');
        toast.error(err.response?.data?.message || 'Cannot start this test');
      } finally {
        setLoading(false);
      }
    };
    fetchTest();

    return () => {
      setProctorActive(false);
    };
  }, [id]);

  // ─── Persist answers to sessionStorage ───
  useEffect(() => {
    if (testData && !state.testSubmitted) {
      sessionStorage.setItem(`dms_test_${id}`, JSON.stringify(state.answers));
    }
  }, [state.answers, id, testData, state.testSubmitted]);

  // ─── Submit function ───
  const doSubmit = useCallback(async (auto = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

    try {
      const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const answersArray = Object.entries(state.answers).map(([qNo, opt]) => ({
        questionNo: Number(qNo),
        selectedOption: opt,
      }));

      const res = await API.post(`/student/tests/${id}/submit`, {
        answers: answersArray,
        autoSubmitted: auto,
        violations: violationsRef.current,
        timeTaken,
      });

      dispatch({ type: 'SUBMITTED' });
      sessionStorage.removeItem(`dms_test_${id}`);

      if (auto) {
        toast.error('Test auto-submitted due to violation', { duration: 4000 });
      } else {
        toast.success('Test submitted successfully!');
      }

      navigate(`/student/results/${res.data.data.resultId}`, { replace: true });
    } catch (err) {
      submittedRef.current = false;
      setSubmitting(false);
      toast.error(err.response?.data?.message || 'Submission failed');
    }
  }, [id, state.answers, navigate]);

  // ─── Timer ───
  const { formatted, isWarning, isCritical } = useTimer(
    testData?.duration || 0,
    () => doSubmit(true)
  );

  // ─── Proctor ───
  const handleViolation = useCallback((violation) => {
    violationsRef.current.push(violation);
  }, []);

  const handleAutoSubmit = useCallback(() => {
    doSubmit(true);
  }, [doSubmit]);

  useProctor({
    active: proctorActive && !state.testSubmitted,
    onViolation: handleViolation,
    onAutoSubmit: handleAutoSubmit,
  });

  // ─── Loading / Error ───
  if (loading) {
    return (
      <div className="fixed inset-0 bg-surface-950 flex items-center justify-center z-[9999]">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-surface-400 text-sm">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error || !testData) {
    return (
      <div className="fixed inset-0 bg-surface-950 flex items-center justify-center z-[9999]">
        <div className="text-center max-w-md px-4">
          <HiOutlineExclamationTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-surface-200 mb-2">Cannot Start Test</h2>
          <p className="text-surface-500 text-sm mb-6">{error}</p>
          <button onClick={() => navigate('/student/dashboard')}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium cursor-pointer">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const questions = testData.questions;
  const current = questions[state.currentQuestion];
  const totalQ = questions.length;
  const answeredCount = Object.keys(state.answers).length;
  const unansweredCount = totalQ - answeredCount;

  const getQuestionStatus = (idx) => {
    const qNo = questions[idx].questionNo;
    if (idx === state.currentQuestion) return 'current';
    if (state.flagged.includes(qNo)) return 'flagged';
    if (state.answers[qNo]) return 'answered';
    if (state.visited.includes(idx)) return 'visited';
    return 'notVisited';
  };

  const paletteColors = {
    current: 'ring-2 ring-blue-400 bg-blue-500/20 text-blue-400',
    answered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    flagged: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    visited: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    notVisited: 'bg-surface-800/50 text-surface-500 border-surface-700/30',
  };

  return (
    <div className="fixed inset-0 bg-surface-950 flex flex-col z-[9999] select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* ─── Top Bar ─── */}
      <header className="h-14 bg-surface-900/90 backdrop-blur-lg border-b border-surface-800/50 flex items-center px-4 shrink-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-surface-200 truncate">{testData.title}</h1>
          <p className="text-[10px] text-surface-500">Q{state.currentQuestion + 1} of {totalQ} · {answeredCount} answered</p>
        </div>

        {/* Timer */}
        <div className={`px-4 py-1.5 rounded-xl font-mono text-lg font-bold tracking-wider ${
          isCritical ? 'bg-red-500/20 text-red-400 animate-pulse'
          : isWarning ? 'bg-amber-500/20 text-amber-400'
          : 'bg-surface-800/50 text-surface-200'
        }`}>
          <HiOutlineClock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          {formatted}
        </div>

        {/* Mobile palette toggle */}
        <button onClick={() => setShowPalette(!showPalette)}
          className="ml-3 p-2 rounded-lg bg-surface-800/50 text-surface-400 hover:text-surface-200 lg:hidden cursor-pointer">
          <HiOutlineListBullet className="w-5 h-5" />
        </button>
      </header>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-3xl mx-auto">
            {/* Question Header */}
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1.5 rounded-xl bg-primary-500/20 text-primary-400 text-xs font-bold">
                Q{current.questionNo}
              </span>
              <span className="text-xs text-surface-500">{current.marks} mark{current.marks !== 1 ? 's' : ''}</span>
              {state.flagged.includes(current.questionNo) && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold flex items-center gap-1">
                  <HiOutlineFlag className="w-3 h-3" /> Flagged
                </span>
              )}
            </div>

            {/* Question Text */}
            <p className="text-lg text-surface-100 font-medium leading-relaxed mb-8">
              {current.questionText}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const selected = state.answers[current.questionNo] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => dispatch({ type: 'SET_ANSWER', questionNo: current.questionNo, option: opt })}
                    className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer group ${
                      selected
                        ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/10'
                        : 'border-surface-700/50 bg-surface-900/40 hover:border-surface-600/70 hover:bg-surface-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                        selected
                          ? 'bg-primary-500 text-white'
                          : 'bg-surface-800/60 text-surface-400 group-hover:bg-surface-700/60'
                      }`}>
                        {opt}
                      </span>
                      <span className={`text-sm ${selected ? 'text-surface-100 font-medium' : 'text-surface-300'}`}>
                        {current[`option${opt}`]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        {/* ─── Question Palette (Desktop) ─── */}
        <aside className="hidden lg:flex w-64 bg-surface-900/60 border-l border-surface-800/50 flex-col shrink-0">
          <div className="p-4 border-b border-surface-800/50">
            <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Question Palette</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const status = getQuestionStatus(idx);
                return (
                  <button key={q.questionNo}
                    onClick={() => dispatch({ type: 'NAVIGATE', index: idx })}
                    className={`w-full aspect-square rounded-xl text-xs font-bold border transition-all cursor-pointer ${paletteColors[status]}`}>
                    {q.questionNo}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Legend */}
          <div className="p-4 border-t border-surface-800/50 space-y-2">
            <div className="flex items-center gap-2 text-[10px] text-surface-500">
              <div className="w-3 h-3 rounded bg-surface-800/50 border border-surface-700/30" /> Not Visited
            </div>
            <div className="flex items-center gap-2 text-[10px] text-surface-500">
              <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" /> Visited
            </div>
            <div className="flex items-center gap-2 text-[10px] text-surface-500">
              <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" /> Answered
            </div>
            <div className="flex items-center gap-2 text-[10px] text-surface-500">
              <div className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500/30" /> Flagged
            </div>
          </div>
        </aside>

        {/* ─── Question Palette (Mobile Bottom Sheet) ─── */}
        {showPalette && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setShowPalette(false)} />
            <div className="fixed bottom-0 left-0 right-0 bg-surface-900 border-t border-surface-800/50 rounded-t-2xl z-50 lg:hidden max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-surface-800/50">
                <h3 className="text-sm font-semibold text-surface-200">Question Palette</h3>
                <button onClick={() => setShowPalette(false)} className="p-1 text-surface-400 cursor-pointer">
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-8 gap-2">
                  {questions.map((q, idx) => {
                    const status = getQuestionStatus(idx);
                    return (
                      <button key={q.questionNo}
                        onClick={() => { dispatch({ type: 'NAVIGATE', index: idx }); setShowPalette(false); }}
                        className={`w-full aspect-square rounded-lg text-xs font-bold border transition-all cursor-pointer ${paletteColors[status]}`}>
                        {q.questionNo}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                  <span className="flex items-center gap-1.5 text-[10px] text-surface-500"><span className="w-3 h-3 rounded bg-surface-800/50 border border-surface-700/30" /> Not Visited</span>
                  <span className="flex items-center gap-1.5 text-[10px] text-surface-500"><span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" /> Visited</span>
                  <span className="flex items-center gap-1.5 text-[10px] text-surface-500"><span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" /> Answered</span>
                  <span className="flex items-center gap-1.5 text-[10px] text-surface-500"><span className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500/30" /> Flagged</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Bottom Bar ─── */}
      <footer className="h-16 bg-surface-900/90 backdrop-blur-lg border-t border-surface-800/50 flex items-center justify-between px-4 shrink-0">
        <button
          onClick={() => dispatch({ type: 'NAVIGATE', index: Math.max(0, state.currentQuestion - 1) })}
          disabled={state.currentQuestion === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-800/50 text-surface-300 hover:bg-surface-700/50 text-sm font-medium disabled:opacity-30 transition-all cursor-pointer">
          <HiOutlineChevronLeft className="w-4 h-4" /> Previous
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FLAG', questionNo: current.questionNo })}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              state.flagged.includes(current.questionNo)
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-surface-800/50 text-surface-400 hover:bg-surface-700/50'
            }`}>
            <HiOutlineFlag className="w-4 h-4" />
            <span className="hidden sm:inline">{state.flagged.includes(current.questionNo) ? 'Unflag' : 'Flag'}</span>
          </button>

          <button onClick={() => setShowConfirm(true)}
            className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-xl shadow-lg shadow-red-500/20 text-sm transition-all cursor-pointer">
            <HiOutlinePaperAirplane className="w-4 h-4" /> Submit
          </button>
        </div>

        <button
          onClick={() => dispatch({ type: 'NAVIGATE', index: Math.min(totalQ - 1, state.currentQuestion + 1) })}
          disabled={state.currentQuestion === totalQ - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-800/50 text-surface-300 hover:bg-surface-700/50 text-sm font-medium disabled:opacity-30 transition-all cursor-pointer">
          Next <HiOutlineChevronRight className="w-4 h-4" />
        </button>
      </footer>

      {/* ─── Submit Confirmation Modal ─── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-surface-900 border border-surface-800/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/15 flex items-center justify-center">
                <HiOutlineExclamationTriangle className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-surface-100 mb-2">Submit Test?</h3>
              <p className="text-surface-400 text-sm mb-1">
                You have answered <span className="text-surface-200 font-semibold">{answeredCount}</span> of <span className="text-surface-200 font-semibold">{totalQ}</span> questions.
              </p>
              {unansweredCount > 0 && (
                <p className="text-amber-400 text-sm font-medium">
                  {unansweredCount} question{unansweredCount !== 1 ? 's' : ''} unanswered!
                </p>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-surface-800/60 hover:bg-surface-700/60 text-surface-300 font-medium rounded-xl text-sm transition-colors cursor-pointer">
                Review
              </button>
              <button onClick={() => { setShowConfirm(false); doSubmit(false); }} disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 cursor-pointer">
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeTest;
