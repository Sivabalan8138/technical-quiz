const { protect, authorize } = require('../../backend/src/utils/auth');
const connectDB = require('../../backend/src/config/db');
const Result = require('../../backend/src/models/Result');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) };
  }

  try {
    await connectDB();
    const user = await protect(event);
    authorize(user, 'Admin');

    const quizId = event.queryStringParameters.quizId;
    if (!quizId) {
       return { statusCode: 400, body: JSON.stringify({ success: false, error: 'quizId is required' }) };
    }
    
    let results = await Result.find({ quiz: quizId })
      .populate('user', 'name department registerNumber year')
      .populate('quiz', 'title')
      .sort('-score timeTaken');

    const rankedResults = results.map((r, index) => ({
      ...r.toObject(),
      rank: index + 1
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        count: rankedResults.length,
        data: rankedResults
      })
    };
  } catch (err) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
