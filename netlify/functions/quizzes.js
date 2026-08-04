const { protect, authorize } = require('../../backend/src/utils/auth');
const connectDB = require('../../backend/src/config/db');
const Quiz = require('../../backend/src/models/Quiz');

exports.handler = async (event, context) => {
  try {
    await connectDB();

    if (event.httpMethod === 'GET') {
      const quizzes = await Quiz.find();
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, count: quizzes.length, data: quizzes })
      };
    } 
    
    if (event.httpMethod === 'POST') {
      const user = await protect(event);
      authorize(user, 'Admin');
      
      const body = JSON.parse(event.body || '{}');
      const quiz = await Quiz.create(body);
      
      return {
        statusCode: 201,
        body: JSON.stringify({ success: true, data: quiz })
      };
    }

    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
