const connectDB = require('../backend/src/config/db');
const User = require('../backend/src/models/User');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    await connectDB();
    const { name, registerNumber, department, year } = req.body || {};

    if (!name || !registerNumber || !department || !year) {
      return res.status(400).json({ success: false, error: 'Please provide all details' });
    }

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

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};
