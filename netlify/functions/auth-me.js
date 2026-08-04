const { protect } = require('../../backend/src/utils/auth');
const connectDB = require('../../backend/src/config/db');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) };
  }

  try {
    await connectDB();
    const user = await protect(event);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: user
      })
    };
  } catch (err) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
