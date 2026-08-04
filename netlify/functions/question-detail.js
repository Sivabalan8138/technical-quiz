const { protect, authorize } = require('../../backend/src/utils/auth');
const connectDB = require('../../backend/src/config/db');
const Question = require('../../backend/src/models/Question');

exports.handler = async (event, context) => {
  try {
    await connectDB();
    const user = await protect(event);
    authorize(user, 'Admin');

    const id = event.queryStringParameters.id;

    if (!id) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'id is required' }) };
    }

    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      let question = await Question.findById(id);

      if (!question) {
        return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Question not found' }) };
      }

      question = await Question.findByIdAndUpdate(id, body, {
        new: true,
        runValidators: true
      });

      return { statusCode: 200, body: JSON.stringify({ success: true, data: question }) };
    }

    if (event.httpMethod === 'DELETE') {
      const question = await Question.findById(id);

      if (!question) {
        return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Question not found' }) };
      }

      await question.deleteOne();
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
