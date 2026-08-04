const { protect, authorize } = require('../backend/src/utils/auth');
const connectDB = require('../backend/src/config/db');
const Result = require('../backend/src/models/Result');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    await connectDB();
    const user = await protect(req);
    authorize(user, 'Admin');

    const quizId = req.query.quizId;
    if (!quizId) {
       return res.status(400).json({ success: false, error: 'quizId is required' });
    }
    
    const results = await Result.find({ quiz: quizId });
    if (results.length === 0) {
      return res.status(200).json({ success: true, data: { message: 'No submissions yet.' } });
    }

    const scores = results.map(r => r.score);
    const percentages = results.map(r => r.percentage);
    
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    const passedCount = results.filter(r => r.passed).length;
    const passPercentage = (passedCount / results.length) * 100;

    const questionStats = {};
    results.forEach(result => {
      result.answers.forEach(ans => {
        if (!questionStats[ans.questionId]) {
          questionStats[ans.questionId] = { correct: 0, wrong: 0 };
        }
        if (ans.isCorrect) {
          questionStats[ans.questionId].correct++;
        } else {
          questionStats[ans.questionId].wrong++;
        }
      });
    });

    return res.status(200).json({
      success: true,
      data: {
        totalSubmissions: results.length,
        highestScore,
        lowestScore,
        averageScore: Number(averageScore.toFixed(2)),
        passPercentage: Number(passPercentage.toFixed(2)),
        questionStats
      }
    });
  } catch (err) {
    return res.status(401).json({ success: false, error: err.message });
  }
};
