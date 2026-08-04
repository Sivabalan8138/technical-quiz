const { protect, authorize } = require('../backend/src/utils/auth');
const connectDB = require('../backend/src/config/db');
const Question = require('../backend/src/models/Question');

module.exports = async (req, res) => {
  try {
    await connectDB();
    const user = await protect(req);
    const quizId = req.query.quizId;

    if (!quizId) {
      return res.status(400).json({ success: false, error: 'quizId is required' });
    }

    if (req.method === 'GET') {
      let query = Question.find({ quiz: quizId });
      
      if (user.role === 'Student') {
        query = query.select('-correctAnswer');
      }

      const questions = await query;
      return res.status(200).json({ success: true, count: questions.length, data: questions });
    }
    
    if (req.method === 'POST') {
      authorize(user, 'Admin');
      
      const body = req.body || {};
      body.quiz = quizId;
      const question = await Question.create(body);
      
      return res.status(201).json({ success: true, data: question });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};
