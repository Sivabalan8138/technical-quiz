const { protect, authorize } = require('../backend/src/utils/auth');
const connectDB = require('../backend/src/config/db');
const Result = require('../backend/src/models/Result');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    await connectDB();
    const user = await protect(req);
    authorize(user, 'Admin');

    const quizId = req.query.quizId;
    if (!quizId) {
       return res.status(400).json({ success: false, error: 'quizId is required' });
    }
    
    let results = await Result.find({ quiz: quizId })
      .populate('user', 'name department registerNumber year')
      .populate('quiz', 'title')
      .sort('-score timeTaken');

    const rankedResults = results.map((r, index) => ({
      ...r.toObject(),
      rank: index + 1
    }));

    return res.status(200).json({
      success: true,
      count: rankedResults.length,
      data: rankedResults
    });
  } catch (err) {
    return res.status(401).json({ success: false, error: err.message });
  }
};
