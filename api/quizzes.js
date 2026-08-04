const { protect, authorize } = require('../backend/src/utils/auth');
const connectDB = require('../backend/src/config/db');
const Quiz = require('../backend/src/models/Quiz');

module.exports = async (req, res) => {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const quizzes = await Quiz.find();
      return res.status(200).json({ success: true, count: quizzes.length, data: quizzes });
    } 
    
    if (req.method === 'POST') {
      const user = await protect(req);
      authorize(user, 'Admin');
      
      const body = req.body || {};
      const quiz = await Quiz.create(body);
      
      return res.status(201).json({ success: true, data: quiz });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};
