const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Result = require('../models/Result');

// @desc    Get admin dashboard stats
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'Student' });
    const totalQuizzes = await Quiz.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const completedTests = await Result.countDocuments();
    
    // Recent activity
    const recentActivity = await Result.find()
      .sort('-completedAt')
      .limit(5)
      .populate('user', 'name email registerNumber year')
      .populate('quiz', 'title');

    // Calculate Submission Trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const trendResults = await Result.aggregate([
      {
        $match: {
          completedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          submissions: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Format the trends to ensure all 7 days are represented
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const submissionTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const dayName = days[d.getDay()];
      
      const found = trendResults.find(t => t._id === dateString);
      submissionTrends.push({
        name: dayName,
        submissions: found ? found.submissions : 0
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalQuizzes,
        totalQuestions,
        completedTests,
        recentActivity,
        submissionTrends
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get all results for a specific quiz (Admin View)
// @route   GET /api/v1/admin/quizzes/:quizId/results
// @access  Private/Admin
exports.getQuizResults = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    
    let results = await Result.find({ quiz: quizId })
      .populate('user', 'name department registerNumber year')
      .populate('quiz', 'title')
      .sort('-score timeTaken'); // Sort by score desc, then timeTaken asc (faster is better)

    // Calculate Rank dynamically
    const rankedResults = results.map((r, index) => ({
      ...r.toObject(),
      rank: index + 1
    }));

    res.status(200).json({
      success: true,
      count: rankedResults.length,
      data: rankedResults
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get analytics for a specific quiz (Admin View)
// @route   GET /api/v1/admin/quizzes/:quizId/analytics
// @access  Private/Admin
exports.getQuizAnalytics = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    
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

    // Question-wise Analysis
    // Structure: { questionId: { correct: count, wrong: count } }
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

    res.status(200).json({
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
    res.status(400).json({ success: false, error: err.message });
  }
};
