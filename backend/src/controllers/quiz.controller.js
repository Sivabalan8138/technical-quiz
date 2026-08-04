const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Result = require('../models/Result');
const { evaluateDescriptiveAnswer } = require('../utils/aiService');

// @desc    Get all quizzes (Students see this)
// @route   GET /api/v1/quizzes
// @access  Private
exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.status(200).json({ success: true, count: quizzes.length, data: quizzes });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get single quiz
// @route   GET /api/v1/quizzes/:id
// @access  Private
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    res.status(200).json({ success: true, data: quiz });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Create new quiz
// @route   POST /api/v1/quizzes
// @access  Private/Admin
exports.createQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.create(req.body);
    res.status(201).json({ success: true, data: quiz });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update quiz
// @route   PUT /api/v1/quizzes/:id
// @access  Private/Admin
exports.updateQuiz = async (req, res) => {
  try {
    let quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: quiz });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Delete quiz
// @route   DELETE /api/v1/quizzes/:id
// @access  Private/Admin
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    await quiz.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Submit a quiz (Automatic Evaluation)
// @route   POST /api/v1/quizzes/:id/submit
// @access  Private (Student)
exports.submitQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const { answers, timeTaken } = req.body; // answers is { qId: "A", qId2: "B" }
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });

    // Fetch all questions for this quiz to check answers securely
    const questions = await Question.find({ quiz: quizId });
    
    let score = 0;
    let correctAnswersCount = 0;
    let wrongAnswersCount = 0;
    const evaluatedAnswers = [];
    let aiFeedbackAggregated = null;

    if (quiz.quizType === 'Descriptive') {
      // Evaluate descriptive answers using AI
      let totalConcept = 0, totalTechnical = 0, totalLogic = 0, totalGrammar = 0;
      let allStrengths = [];
      let allSuggestions = [];
      let validEvalCount = 0;

      for (const q of questions) {
        const studentAnswer = answers[q._id.toString()] || '';
        
        let aiScores;
        if (quiz.aiEvaluationEnabled && studentAnswer.trim().length > 0) {
          try {
            aiScores = await evaluateDescriptiveAnswer(q.text, studentAnswer, q.rubric);
          } catch (e) {
            console.error(e);
            aiScores = { conceptUnderstanding: 0, technicalAccuracy: 0, logicalExplanation: 0, grammar: 0, strengths: [], suggestions: [] };
          }
        } else {
          aiScores = { conceptUnderstanding: 0, technicalAccuracy: 0, logicalExplanation: 0, grammar: 0, strengths: [], suggestions: [] };
        }

        // Calculate average mark out of 10 for this question, then scale to the question's marks
        const avgScoreOutOf10 = (aiScores.conceptUnderstanding + aiScores.technicalAccuracy + aiScores.logicalExplanation + aiScores.grammar) / 4;
        const marksAwarded = Math.round((avgScoreOutOf10 / 10) * q.marks);

        score += marksAwarded;
        
        evaluatedAnswers.push({
          questionId: q._id,
          textAnswer: studentAnswer,
          marksAwarded
        });

        if (quiz.aiEvaluationEnabled && studentAnswer.trim().length > 0) {
          totalConcept += aiScores.conceptUnderstanding;
          totalTechnical += aiScores.technicalAccuracy;
          totalLogic += aiScores.logicalExplanation;
          totalGrammar += aiScores.grammar;
          if (aiScores.strengths) allStrengths.push(...aiScores.strengths);
          if (aiScores.suggestions) allSuggestions.push(...aiScores.suggestions);
          validEvalCount++;
        }
      }

      if (validEvalCount > 0) {
        aiFeedbackAggregated = {
          conceptUnderstanding: Math.round(totalConcept / validEvalCount),
          technicalAccuracy: Math.round(totalTechnical / validEvalCount),
          logicalExplanation: Math.round(totalLogic / validEvalCount),
          grammar: Math.round(totalGrammar / validEvalCount),
          strengths: [...new Set(allStrengths)].slice(0, 5), // Top 5 unique strengths
          suggestions: [...new Set(allSuggestions)].slice(0, 5)
        };
      }
    } else {
      // Evaluate MCQ answers
      for (const q of questions) {
        const studentAnswer = answers[q._id.toString()];
        let isCorrect = false;

        if (studentAnswer) {
          if (studentAnswer === q.correctAnswer) {
            isCorrect = true;
            score += q.marks;
            correctAnswersCount++;
          } else {
            wrongAnswersCount++;
          }
        }

        evaluatedAnswers.push({
          questionId: q._id,
          selectedOption: studentAnswer || null,
          isCorrect
        });
      }
    }

    const percentage = (score / quiz.totalMarks) * 100;

    const resultPayload = {
      user: req.user.id,
      quiz: quizId,
      score,
      totalMarks: quiz.totalMarks,
      percentage: Number(percentage.toFixed(2)),
      correctAnswers: correctAnswersCount,
      wrongAnswers: wrongAnswersCount,
      timeTaken: timeTaken || 0,
      answers: evaluatedAnswers
    };

    if (aiFeedbackAggregated) {
      resultPayload.aiFeedback = aiFeedbackAggregated;
    }

    const result = await Result.create(resultPayload);

    // We do NOT return the full evaluated answers back to the student!
    res.status(201).json({
      success: true,
      data: {
        score: result.score,
        percentage: result.percentage,
        message: 'Your quiz has been submitted successfully.'
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get logged in user's results
// @route   GET /api/v1/quizzes/my-results
// @access  Private
exports.getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ user: req.user.id }).populate('quiz', 'title category quizType');
    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
