const { protect, authorize } = require('../../backend/src/utils/auth');
const connectDB = require('../../backend/src/config/db');
const Question = require('../../backend/src/models/Question');

exports.handler = async (event, context) => {
  try {
    await connectDB();
    const user = await protect(event);
    const quizId = event.queryStringParameters.quizId;

    if (!quizId) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'quizId is required' }) };
    }

    if (event.httpMethod === 'GET') {
      let query = Question.find({ quiz: quizId });
      
      if (user.role === 'Student') {
        query = query.select('-correctAnswer');
      }

      const questions = await query;
      return { statusCode: 200, body: JSON.stringify({ success: true, count: questions.length, data: questions }) };
    }
    
    if (event.httpMethod === 'POST') {
      authorize(user, 'Admin');
      
      const body = JSON.parse(event.body || '{}');
      body.quiz = quizId;
      const question = await Question.create(body);
      
      return { statusCode: 201, body: JSON.stringify({ success: true, data: question }) };
    }

    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
