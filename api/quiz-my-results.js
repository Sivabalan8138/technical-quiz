const { protect } = require('../backend/src/utils/auth');
const connectDB = require('../backend/src/config/db');
const Result = require('../backend/src/models/Result');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    await connectDB();
    const user = await protect(req);
    
    const results = await Result.find({ user: user.id }).populate('quiz', 'title category quizType');
    
    return res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};
