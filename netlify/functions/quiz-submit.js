const { protect } = require('../../backend/src/utils/auth');
const connectDB = require('../../backend/src/config/db');
const Quiz = require('../../backend/src/models/Quiz');
const Question = require('../../backend/src/models/Question');
const Result = require('../../backend/src/models/Result');
const { evaluateDescriptiveAnswer } = require('../../backend/src/utils/aiService');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) };
  }

  try {
    await connectDB();
    const user = await protect(event);
    const quizId = event.queryStringParameters.id;

    if (!quizId) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'quizId is required' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const { answers, timeTaken } = body;
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Quiz not found' }) };

    const questions = await Question.find({ quiz: quizId });
    
    let score = 0;
    let correctAnswersCount = 0;
    let wrongAnswersCount = 0;
    const evaluatedAnswers = [];
    let aiFeedbackAggregated = null;

    if (quiz.quizType === 'Descriptive') {
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
          strengths: [...new Set(allStrengths)].slice(0, 5),
          suggestions: [...new Set(allSuggestions)].slice(0, 5)
        };
      }
    } else {
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
      user: user.id,
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

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        data: {
          score: result.score,
          percentage: result.percentage,
          message: 'Your quiz has been submitted successfully.'
        }
      })
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
