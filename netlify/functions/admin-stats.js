const { protect, authorize } = require('../../backend/src/utils/auth');
const connectDB = require('../../backend/src/config/db');
const User = require('../../backend/src/models/User');
const Quiz = require('../../backend/src/models/Quiz');
const Question = require('../../backend/src/models/Question');
const Result = require('../../backend/src/models/Result');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) };
  }

  try {
    await connectDB();
    const user = await protect(event);
    authorize(user, 'Admin');

    const totalStudents = await User.countDocuments({ role: 'Student' });
    const totalQuizzes = await Quiz.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const completedTests = await Result.countDocuments();
    
    const recentActivity = await Result.find()
      .sort('-completedAt')
      .limit(5)
      .populate('user', 'name email registerNumber year')
      .populate('quiz', 'title');

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

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          totalStudents,
          totalQuizzes,
          totalQuestions,
          completedTests,
          recentActivity,
          submissionTrends
        }
      })
    };
  } catch (err) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
