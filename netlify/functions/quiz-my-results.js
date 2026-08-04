const { protect } = require('../../backend/src/utils/auth');
const connectDB = require('../../backend/src/config/db');
const Result = require('../../backend/src/models/Result');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) };
  }

  try {
    await connectDB();
    const user = await protect(event);
    
    const results = await Result.find({ user: user.id }).populate('quiz', 'title category quizType');
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        count: results.length,
        data: results
      })
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
