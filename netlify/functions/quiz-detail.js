const { protect, authorize } = require('../../backend/src/utils/auth');
const connectDB = require('../../backend/src/config/db');
const Quiz = require('../../backend/src/models/Quiz');

exports.handler = async (event, context) => {
  try {
    await connectDB();
    const id = event.queryStringParameters.id;

    if (!id) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'id is required' }) };
    }

    if (event.httpMethod === 'GET') {
      const quiz = await Quiz.findById(id);
      if (!quiz) return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Quiz not found' }) };
      
      return { statusCode: 200, body: JSON.stringify({ success: true, data: quiz }) };
    } 
    
    if (event.httpMethod === 'PUT') {
      const user = await protect(event);
      authorize(user, 'Admin');
      
      const body = JSON.parse(event.body || '{}');
      let quiz = await Quiz.findById(id);
      if (!quiz) return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Quiz not found' }) };

      quiz = await Quiz.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      return { statusCode: 200, body: JSON.stringify({ success: true, data: quiz }) };
    }

    if (event.httpMethod === 'DELETE') {
      const user = await protect(event);
      authorize(user, 'Admin');
      
      const quiz = await Quiz.findById(id);
      if (!quiz) return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Quiz not found' }) };

      await quiz.deleteOne();
      return { statusCode: 200, body: JSON.stringify({ success: true, data: {} }) };
    }

    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
