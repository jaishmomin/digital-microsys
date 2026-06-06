const PDFDocument = require('pdfkit');
const Result = require('../models/Result');
const Test = require('../models/Test');
const AnswerKey = require('../models/AnswerKey');
const Violation = require('../models/Violation');
const Question = require('../models/Question');
const evaluateAnswers = require('../utils/evaluateAnswers');

// ─── Color palette ───
const COLORS = {
  primary: '#4f46e5',   // Indigo-600
  dark: '#1e1b4b',      // Indigo-950
  text: '#111827',       // Gray-900
  textMuted: '#6b7280',  // Gray-500
  green: '#059669',      // Emerald-600
  greenBg: '#d1fae5',   // Emerald-100
  red: '#dc2626',        // Red-600
  redBg: '#fee2e2',     // Red-100
  amber: '#d97706',      // Amber-600
  amberBg: '#fef3c7',   // Amber-100
  border: '#e5e7eb',     // Gray-200
  headerBg: '#eef2ff',  // Indigo-50
  white: '#ffffff',
};

// ─── PDF helper functions ───
function drawHr(doc, y, width) {
  doc.moveTo(40, y).lineTo(width - 40, y).strokeColor(COLORS.border).lineWidth(0.5).stroke();
}

function drawBox(doc, x, y, w, h, { fill = COLORS.white, stroke = COLORS.border } = {}) {
  doc.roundedRect(x, y, w, h, 4).fillAndStroke(fill, stroke);
}

function drawKeyValue(doc, x, y, label, value, opts = {}) {
  const { labelWidth = 130, fontSize = 9 } = opts;
  doc.fillColor(COLORS.textMuted).fontSize(fontSize).text(label, x, y, { width: labelWidth });
  doc.fillColor(COLORS.text).fontSize(fontSize).text(value, x + labelWidth, y);
}

function formatTime(sec) {
  if (!sec) return '0m 0s';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function formatDate(d) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ═══════════════════════════════════════════════════
//  Existing controllers (unchanged)
// ═══════════════════════════════════════════════════

/**
 * @desc    Submit test answers (student) — legacy route
 * @route   POST /api/results/submit
 */
exports.submitTest = async (req, res, next) => {
  try {
    const { testId, answers, timeTaken, autoSubmitted, violations } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    const attemptCount = await Result.countDocuments({ testId, studentId: req.user._id });
    if (attemptCount >= test.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: `Maximum attempts (${test.maxAttempts}) reached`,
      });
    }

    // Fetch questions + answer key for evaluation
    const questions = await Question.find({ testId }).sort({ questionNo: 1 });
    const answerKey = await AnswerKey.findOne({ testId });

    const evaluation = evaluateAnswers({
      studentAnswers: answers || [],
      answerKeyMap: answerKey ? answerKey.answers : [],
      questions,
      marksPerQuestion: test.marksPerQuestion,
      negativeMarking: test.negativeMarking,
      negativeMarks: test.negativeMarks || 0.25,
    });

    // Save violations
    if (violations && violations.length > 0) {
      const violationDocs = violations.map((v) => ({
        studentId: req.user._id,
        testId,
        violationType: v.type,
        timestamp: v.timestamp || new Date(),
        description: v.description || '',
      }));
      await Violation.insertMany(violationDocs);
    }

    const result = await Result.create({
      testId,
      studentId: req.user._id,
      answers,
      score: evaluation.score,
      totalMarks: evaluation.totalMarks,
      correctAnswers: evaluation.correctCount,
      incorrectAnswers: evaluation.incorrectCount,
      unattempted: evaluation.unattemptedCount,
      percentage: evaluation.percentage,
      timeTaken: timeTaken || 0,
      attemptNumber: attemptCount + 1,
      autoSubmitted: autoSubmitted || false,
      violations: violations || [],
      status: 'graded',
      submittedAt: new Date(),
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Test submitted and graded',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** @route GET /api/results/my-results */
exports.getMyResults = async (req, res, next) => {
  try {
    const results = await Result.find({ studentId: req.user._id })
      .populate('testId', 'title subject totalMarks duration')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: results });
  } catch (error) { next(error); }
};

/** @route GET /api/results/test/:testId */
exports.getResultsByTest = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.testId).select('title subject totalMarks passingPercentage');
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    const results = await Result.find({ testId: req.params.testId })
      .populate('studentId', 'name email rollNumber department')
      .sort({ score: -1 });

    const resultsWithViolations = await Promise.all(
      results.map(async (r) => {
        const rObj = r.toObject();
        rObj.violationCount = await Violation.countDocuments({
          studentId: r.studentId?._id,
          testId: req.params.testId,
        });
        return rObj;
      })
    );

    res.json({ success: true, data: { test, results: resultsWithViolations } });
  } catch (error) { next(error); }
};

/** @route GET /api/results */
exports.getAllResults = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.testId) filter.testId = req.query.testId;

    const [results, total] = await Promise.all([
      Result.find(filter)
        .populate('studentId', 'name email rollNumber')
        .populate('testId', 'title subject totalMarks')
        .sort({ submittedAt: -1 })
        .skip(skip).limit(limit),
      Result.countDocuments(filter),
    ]);

    const resultsWithViolations = await Promise.all(
      results.map(async (r) => {
        const rObj = r.toObject();
        rObj.violationCount = await Violation.countDocuments({
          studentId: r.studentId?._id, testId: r.testId?._id,
        });
        return rObj;
      })
    );

    res.json({
      success: true,
      data: resultsWithViolations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) { next(error); }
};

/** @route GET /api/results/:id */
exports.getResultById = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('testId')
      .populate('studentId', 'name email rollNumber department');

    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

    if (req.user.role === 'student' && result.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const rObj = result.toObject();
    if (req.user.role === 'admin') {
      rObj.questions = await Question.find({ testId: result.testId._id }).sort({ questionNo: 1 });
      rObj.answerKey = await AnswerKey.findOne({ testId: result.testId._id });
      rObj.violationCount = await Violation.countDocuments({
        studentId: result.studentId._id, testId: result.testId._id,
      });
    }

    res.json({ success: true, data: rObj });
  } catch (error) { next(error); }
};

/** @route PUT /api/results/:id/grade */
exports.gradeResult = async (req, res, next) => {
  try {
    const { score, feedback } = req.body;
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

    if (score !== undefined) result.score = score;
    if (feedback) result.feedback = feedback;
    result.status = 'graded';
    await result.save();
    res.json({ success: true, message: 'Result graded successfully', data: result });
  } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════
//  PDF GENERATION — Single Student Result
// ═══════════════════════════════════════════════════

/**
 * @desc    Export single student result as professional PDF (pdfkit)
 * @route   GET /api/results/:id/export-pdf
 * @access  Private (admin or owning student)
 */
exports.exportSingleResultPDF = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('testId')
      .populate('studentId', 'name email rollNumber department');

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    // Students can only export their own results
    if (req.user.role === 'student' && result.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const test = result.testId;
    const student = result.studentId;
    const questions = await Question.find({ testId: test._id }).sort({ questionNo: 1 });
    const answerKey = await AnswerKey.findOne({ testId: test._id });
    const violations = await Violation.find({
      studentId: student._id, testId: test._id,
    }).sort({ timestamp: 1 });

    // Evaluate answers
    const evaluation = evaluateAnswers({
      studentAnswers: result.answers,
      answerKeyMap: answerKey ? answerKey.answers : [],
      questions,
      marksPerQuestion: test.marksPerQuestion,
      negativeMarking: test.negativeMarking,
      negativeMarks: test.negativeMarks || 0.25,
    });

    const passingPct = test.passingPercentage || 40;
    const passed = evaluation.percentage >= passingPct;

    // ─── Create PDF ───
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      const safeName = `result_${student?.rollNumber || 'student'}_${test?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'test'}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
      res.send(pdfBuffer);
    });

    const pageW = doc.page.width;
    const contentW = pageW - 80; // 40px margin each side

    // ════════ PAGE 1 — Header & Summary ════════

    // Logo / Title
    doc.fontSize(22).fillColor(COLORS.primary).text('Digital Microsys', 40, 40, { align: 'center' });
    doc.fontSize(11).fillColor(COLORS.textMuted).text('Examination Result Report', 40, 68, { align: 'center' });
    drawHr(doc, 88, pageW);

    // Student Details Box
    let y = 100;
    drawBox(doc, 40, y, contentW, 85, { fill: COLORS.headerBg });
    doc.fontSize(10).fillColor(COLORS.primary).text('STUDENT DETAILS', 55, y + 10);
    y += 28;
    drawKeyValue(doc, 55, y, 'Name:', student?.name || 'N/A');
    drawKeyValue(doc, 55 + contentW / 2, y, 'Roll Number:', student?.rollNumber || 'N/A');
    y += 16;
    drawKeyValue(doc, 55, y, 'Email:', student?.email || 'N/A');
    drawKeyValue(doc, 55 + contentW / 2, y, 'Test Name:', test?.title || 'N/A');
    y += 16;
    drawKeyValue(doc, 55, y, 'Subject:', test?.subject || 'N/A');
    drawKeyValue(doc, 55 + contentW / 2, y, 'Test Date:', formatDate(test?.startTime));

    // Result Summary Box
    y = 200;
    drawBox(doc, 40, y, contentW, 130, { fill: COLORS.white });
    doc.fontSize(10).fillColor(COLORS.primary).text('RESULT SUMMARY', 55, y + 10);
    y += 30;

    const col1 = 55;
    const col2 = 55 + contentW / 3;
    const col3 = 55 + (contentW / 3) * 2;

    drawKeyValue(doc, col1, y, 'Total Questions:', String(questions.length));
    drawKeyValue(doc, col2, y, 'Attempted:', String(evaluation.correctCount + evaluation.incorrectCount));
    drawKeyValue(doc, col3, y, 'Unattempted:', String(evaluation.unattemptedCount));
    y += 18;
    drawKeyValue(doc, col1, y, 'Correct Answers:', String(evaluation.correctCount));
    drawKeyValue(doc, col2, y, 'Incorrect Answers:', String(evaluation.incorrectCount));
    drawKeyValue(doc, col3, y, 'Marks Obtained:', `${evaluation.score} / ${evaluation.totalMarks}`);
    y += 18;
    drawKeyValue(doc, col1, y, 'Percentage:', `${evaluation.percentage}%`);
    drawKeyValue(doc, col2, y, 'Status:', passed ? 'PASSED' : 'FAILED');
    drawKeyValue(doc, col3, y, 'Time Taken:', formatTime(result.timeTaken));
    y += 18;
    drawKeyValue(doc, col1, y, 'Submission Type:', result.autoSubmitted ? 'Auto-Submitted' : 'Manual');
    drawKeyValue(doc, col2, y, 'Attempt #:', String(result.attemptNumber || 1));
    drawKeyValue(doc, col3, y, 'Submitted At:', formatDate(result.submittedAt));

    // Pass/Fail badge
    y += 28;
    const badgeColor = passed ? COLORS.green : COLORS.red;
    const badgeBg = passed ? COLORS.greenBg : COLORS.redBg;
    const badgeText = passed ? '✓  PASSED' : '✗  FAILED';
    doc.roundedRect(pageW / 2 - 60, y, 120, 28, 14).fillAndStroke(badgeBg, badgeColor);
    doc.fontSize(13).fillColor(badgeColor).text(badgeText, pageW / 2 - 60, y + 7, { width: 120, align: 'center' });

    // ════════ PAGE 2 — Answer Sheet ════════
    doc.addPage();
    doc.fontSize(14).fillColor(COLORS.primary).text('Answer Sheet — Question Comparison', 40, 40);
    drawHr(doc, 60, pageW);

    // Table header
    const tableTop = 75;
    const colWidths = [35, 180, 60, 60, 50, 50]; // Q.No, Question, Your Ans, Correct, Result, Marks
    const tableHeaders = ['Q.No', 'Question', 'Your Ans', 'Correct', 'Result', 'Marks'];

    const drawTableRow = (rowY, cells, opts = {}) => {
      const { bg = COLORS.white, isHeader = false } = opts;
      const rowH = isHeader ? 22 : 20;

      // Row background
      doc.rect(40, rowY, contentW, rowH).fill(bg);

      let x = 45;
      cells.forEach((cell, i) => {
        const w = colWidths[i];
        doc.fillColor(isHeader ? COLORS.white : COLORS.text)
          .fontSize(isHeader ? 8 : 7.5)
          .text(String(cell).substring(0, i === 1 ? 60 : 20), x, rowY + (isHeader ? 6 : 5), {
            width: w - 5,
            lineBreak: false,
          });
        x += w;
      });

      // Borders
      doc.rect(40, rowY, contentW, rowH).strokeColor(COLORS.border).lineWidth(0.3).stroke();
    };

    // Header row
    drawTableRow(tableTop, tableHeaders, { bg: COLORS.primary, isHeader: true });

    let rowY = tableTop + 22;
    const comparison = evaluation.detailedComparison;

    for (let i = 0; i < comparison.length; i++) {
      const q = comparison[i];

      // Page break check
      if (rowY + 22 > doc.page.height - 60) {
        doc.addPage();
        rowY = 40;
        drawTableRow(rowY, tableHeaders, { bg: COLORS.primary, isHeader: true });
        rowY += 22;
      }

      const bg = q.isUnattempted ? COLORS.amberBg : q.isCorrect ? COLORS.greenBg : COLORS.redBg;
      const resultMark = q.isUnattempted ? '—' : q.isCorrect ? '✓' : '✗';
      const studentAns = q.studentAnswer || 'Not Attempted';
      const marksText = q.isUnattempted ? '0' : q.isCorrect ? `+${q.marks}` : q.marksObtained < 0 ? String(q.marksObtained) : '0';

      drawTableRow(rowY, [q.questionNo, q.questionText, studentAns, q.correctAnswer || '—', resultMark, marksText], { bg });
      rowY += 20;
    }

    // Summary row
    if (rowY + 25 > doc.page.height - 60) { doc.addPage(); rowY = 40; }
    rowY += 5;
    drawBox(doc, 40, rowY, contentW, 22, { fill: COLORS.headerBg });
    doc.fontSize(8).fillColor(COLORS.primary)
      .text(`Summary: ${evaluation.correctCount} Correct  |  ${evaluation.incorrectCount} Incorrect  |  ${evaluation.unattemptedCount} Unattempted  |  Score: ${evaluation.score}/${evaluation.totalMarks} (${evaluation.percentage}%)`,
        50, rowY + 6, { width: contentW - 20 });

    // ════════ PAGE 3 — Security Report (if violations) ════════
    if (violations.length > 0 || result.autoSubmitted) {
      doc.addPage();
      doc.fontSize(14).fillColor(COLORS.red).text('Examination Security Report', 40, 40);
      drawHr(doc, 60, pageW);

      if (result.autoSubmitted) {
        y = 72;
        drawBox(doc, 40, y, contentW, 30, { fill: COLORS.redBg, stroke: COLORS.red });
        doc.fontSize(9).fillColor(COLORS.red)
          .text('⚠  This test was auto-submitted due to a proctoring violation.', 55, y + 10, { width: contentW - 30 });
        y += 45;
      } else {
        y = 72;
      }

      if (violations.length > 0) {
        doc.fontSize(10).fillColor(COLORS.text).text(`Total Violations: ${violations.length}`, 40, y);
        y += 20;

        // Violation table header
        const vColWidths = [35, 180, 200];
        drawTableRow(y, ['Sr.No', 'Violation Type', 'Date & Time'], { bg: COLORS.red, isHeader: true });
        y += 22;

        violations.forEach((v, i) => {
          if (y + 22 > doc.page.height - 60) { doc.addPage(); y = 40; }
          const vType = (v.violationType || v.type || 'Unknown').replace(/([A-Z])/g, ' $1').trim();
          const cells = [i + 1, vType, formatDate(v.timestamp)];
          const x0 = 45;
          doc.rect(40, y, contentW, 20).fill(i % 2 === 0 ? COLORS.white : COLORS.headerBg);
          let cx = x0;
          cells.forEach((cell, ci) => {
            doc.fillColor(COLORS.text).fontSize(7.5).text(String(cell), cx, y + 5, { width: vColWidths[ci] - 5, lineBreak: false });
            cx += vColWidths[ci];
          });
          doc.rect(40, y, contentW, 20).strokeColor(COLORS.border).lineWidth(0.3).stroke();
          y += 20;
        });
      }

      // Footer
      y += 20;
      doc.fontSize(7).fillColor(COLORS.textMuted).text('This report is system-generated by Digital Microsys and does not require a signature.', 40, y, { align: 'center', width: contentW });
    }

    // Page numbers
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc.fontSize(7).fillColor(COLORS.textMuted)
        .text(`Page ${i + 1} of ${totalPages}  |  Generated: ${formatDate(new Date())}`,
          40, doc.page.height - 30, { align: 'center', width: contentW });
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════
//  PDF GENERATION — All Students for a Test (Admin)
// ═══════════════════════════════════════════════════

/**
 * @desc    Export all students' results for a test as PDF
 * @route   GET /api/results/test/:testId/export-pdf
 * @access  Private (admin)
 */
exports.exportResultsPDF = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.testId);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    const results = await Result.find({ testId: req.params.testId })
      .populate('studentId', 'name email rollNumber department')
      .sort({ score: -1 });

    const passingPct = test.passingPercentage || 40;

    // Statistics
    const scores = results.map((r) => r.percentage || 0);
    const passCount = scores.filter((s) => s >= passingPct).length;
    const failCount = scores.length - passCount;
    const highest = scores.length ? Math.max(...scores) : 0;
    const lowest = scores.length ? Math.min(...scores) : 0;
    const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    // ─── Create PDF ───
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40, bufferPages: true });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      const safeName = `results_${test.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
      res.send(pdfBuffer);
    });

    const pageW = doc.page.width;
    const contentW = pageW - 80;

    // Header
    doc.fontSize(18).fillColor(COLORS.primary).text('Digital Microsys', 40, 30, { align: 'center' });
    doc.fontSize(10).fillColor(COLORS.textMuted).text('Test Results Summary Report', 40, 52, { align: 'center' });
    drawHr(doc, 68, pageW);

    // Test Info
    let y = 78;
    drawBox(doc, 40, y, contentW, 48, { fill: COLORS.headerBg });
    doc.fontSize(9).fillColor(COLORS.primary).text('TEST INFORMATION', 55, y + 8);
    y += 22;
    drawKeyValue(doc, 55, y, 'Test:', test.title, { labelWidth: 60 });
    drawKeyValue(doc, 55 + contentW / 3, y, 'Subject:', test.subject || 'N/A', { labelWidth: 60 });
    drawKeyValue(doc, 55 + (contentW / 3) * 2, y, 'Generated:', formatDate(new Date()), { labelWidth: 80 });

    // Statistics Box
    y = 138;
    drawBox(doc, 40, y, contentW, 45, { fill: COLORS.white });
    doc.fontSize(9).fillColor(COLORS.primary).text('STATISTICS', 55, y + 8);
    y += 22;
    const statCol = contentW / 6;
    const stats = [
      ['Total Appeared', results.length],
      ['Highest Score', `${highest}%`],
      ['Lowest Score', `${lowest}%`],
      ['Average Score', `${average}%`],
      ['Passed', passCount],
      ['Failed', failCount],
    ];
    stats.forEach((s, i) => {
      const sx = 55 + i * statCol;
      doc.fontSize(7).fillColor(COLORS.textMuted).text(s[0], sx, y);
      doc.fontSize(10).fillColor(COLORS.text).text(String(s[1]), sx, y + 10);
    });

    // Results Table
    y = 200;
    const colWidths = [40, 55, 170, 85, 55, 55, 55, 55, 55, 60];
    const headers = ['Rank', 'Roll No', 'Student Name', 'Email', 'Score', 'Total', '%', 'Status', 'Auto', 'Time'];

    const drawRow = (ry, cells, opts = {}) => {
      const { bg = COLORS.white, isHeader = false } = opts;
      const rowH = isHeader ? 20 : 18;
      doc.rect(40, ry, contentW, rowH).fill(bg);

      let x = 45;
      cells.forEach((cell, i) => {
        doc.fillColor(isHeader ? COLORS.white : COLORS.text)
          .fontSize(isHeader ? 7.5 : 7)
          .text(String(cell).substring(0, 30), x, ry + (isHeader ? 5 : 4), { width: colWidths[i] - 5, lineBreak: false });
        x += colWidths[i];
      });
      doc.rect(40, ry, contentW, rowH).strokeColor(COLORS.border).lineWidth(0.3).stroke();
    };

    drawRow(y, headers, { bg: COLORS.primary, isHeader: true });
    y += 20;

    results.forEach((r, i) => {
      if (y + 20 > doc.page.height - 50) {
        doc.addPage();
        y = 40;
        drawRow(y, headers, { bg: COLORS.primary, isHeader: true });
        y += 20;
      }

      const pct = r.percentage || 0;
      const pass = pct >= passingPct;
      const bg = pass ? COLORS.greenBg : COLORS.redBg;

      drawRow(y, [
        i + 1,
        r.studentId?.rollNumber || 'N/A',
        r.studentId?.name || 'N/A',
        r.studentId?.email || 'N/A',
        r.score,
        r.totalMarks,
        `${pct}%`,
        pass ? 'PASS' : 'FAIL',
        r.autoSubmitted ? 'Yes' : 'No',
        formatTime(r.timeTaken),
      ], { bg });
      y += 18;
    });

    // Page numbers
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc.fontSize(7).fillColor(COLORS.textMuted)
        .text(`Page ${i + 1} of ${totalPages}  |  Digital Microsys — System Generated Report`,
          40, doc.page.height - 30, { align: 'center', width: contentW });
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};
