const jwt = require('jsonwebtoken');
const User = require('../models/User');
const connectDB = require('../config/db');

// Helper to extract JWT token and get user
exports.protect = async (req) => {
  await connectDB();
  
  let token;
  
  // The header might be 'Authorization' or 'authorization'
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new Error('Not authorized to access this route');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  } catch (err) {
    throw new Error('Not authorized to access this route');
  }
};

// Helper for checking role authorization
exports.authorize = (user, ...roles) => {
  if (!roles.includes(user.role)) {
    throw new Error(`User role ${user.role} is not authorized to access this route`);
  }
};
