const connectDB = require('../../backend/src/config/db');
const User = require('../../backend/src/models/User');
const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) };
  }

  try {
    await connectDB();
    const body = JSON.parse(event.body || '{}');
    const { name, registerNumber, department, year } = body;

    if (!name || !registerNumber || !department || !year) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Please provide all details' })
      };
    }

    // Create user (student) without email/password
    const user = await User.create({
      name,
      registerNumber,
      department,
      year,
      role: 'Student'
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    return {
      statusCode: 201,
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
