/**
 * evaluateAnswers — grade a student's answers against an answer key.
 *
 * @param {Object} options
 * @param {Array}  options.studentAnswers  - [{questionNo, selectedOption}]
 * @param {Array}  options.answerKeyMap    - [{questionNo, correctOption}]
 * @param {Array}  options.questions       - Full question docs from DB
 * @param {number} options.marksPerQuestion - Marks awarded per correct answer
 * @param {boolean} options.negativeMarking - Whether to deduct marks
 * @param {number} options.negativeMarks   - Marks deducted per wrong answer
 *
 * @returns {{ score, percentage, correctCount, incorrectCount,
 *             unattemptedCount, totalMarks, detailedComparison[] }}
 */
function evaluateAnswers({
  studentAnswers = [],
  answerKeyMap = [],
  questions = [],
  marksPerQuestion = 1,
  negativeMarking = false,
  negativeMarks = 0.25,
}) {
  // Build lookup maps
  const keyMap = {};
  answerKeyMap.forEach((a) => {
    keyMap[a.questionNo] = a.correctOption;
  });

  const studentMap = {};
  studentAnswers.forEach((a) => {
    if (a.selectedOption) {
      studentMap[a.questionNo] = a.selectedOption;
    }
  });

  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let score = 0;

  const detailedComparison = questions.map((q) => {
    const qNo = q.questionNo;
    const correctAnswer = keyMap[qNo] || null;
    const studentAnswer = studentMap[qNo] || null;
    const isUnattempted = !studentAnswer;

    let isCorrect = false;
    let marksObtained = 0;

    if (isUnattempted) {
      unattemptedCount++;
      // No marks — never negative for unattempted
    } else if (studentAnswer === correctAnswer) {
      isCorrect = true;
      correctCount++;
      marksObtained = q.marks || marksPerQuestion;
      score += marksObtained;
    } else {
      incorrectCount++;
      if (negativeMarking && negativeMarks > 0) {
        marksObtained = -negativeMarks;
        score -= negativeMarks;
      }
    }

    return {
      questionNo: qNo,
      questionText: q.questionText || '',
      optionA: q.optionA || '',
      optionB: q.optionB || '',
      optionC: q.optionC || '',
      optionD: q.optionD || '',
      correctAnswer,
      studentAnswer,
      isCorrect,
      isUnattempted,
      marks: q.marks || marksPerQuestion,
      marksObtained,
    };
  });

  // Score cannot go below 0
  score = Math.max(0, Math.round(score * 100) / 100);

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || marksPerQuestion), 0);
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  return {
    score,
    totalMarks,
    percentage,
    correctCount,
    incorrectCount,
    unattemptedCount,
    detailedComparison,
  };
}

module.exports = evaluateAnswers;
