const connectDB = require('../../backend/src/config/db');
const User = require('../../backend/src/models/User');
const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) };
  }

  try {
    await connectDB();
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Please provide an email and password' })
      };
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || user.role !== 'Admin') {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Invalid admin credentials' })
      };
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Invalid admin credentials' })
      };
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      })
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
