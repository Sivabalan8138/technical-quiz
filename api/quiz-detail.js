const { protect, authorize } = require('../backend/src/utils/auth');
const connectDB = require('../backend/src/config/db');
const Quiz = require('../backend/src/models/Quiz');

module.exports = async (req, res) => {
  try {
    await connectDB();
    const id = req.query.id;

    if (!id) {
      return res.status(400).json({ success: false, error: 'id is required' });
    }

    if (req.method === 'GET') {
      const quiz = await Quiz.findById(id);
      if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });
      
      return res.status(200).json({ success: true, data: quiz });
    } 
    
    if (req.method === 'PUT') {
      const user = await protect(req);
      authorize(user, 'Admin');
      
      const body = req.body || {};
      let quiz = await Quiz.findById(id);
      if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });

      quiz = await Quiz.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      return res.status(200).json({ success: true, data: quiz });
    }

    if (req.method === 'DELETE') {
      const user = await protect(req);
      authorize(user, 'Admin');
      
      const quiz = await Quiz.findById(id);
      if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });

      await quiz.deleteOne();
      return res.status(200).json({ success: true, data: {} });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};
