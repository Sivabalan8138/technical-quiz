const { protect, authorize } = require('../backend/src/utils/auth');
const connectDB = require('../backend/src/config/db');
const Question = require('../backend/src/models/Question');

module.exports = async (req, res) => {
  try {
    await connectDB();
    const user = await protect(req);
    authorize(user, 'Admin');

    const id = req.query.id;

    if (!id) {
      return res.status(400).json({ success: false, error: 'id is required' });
    }

    if (req.method === 'PUT') {
      const body = req.body || {};
      let question = await Question.findById(id);

      if (!question) {
        return res.status(404).json({ success: false, error: 'Question not found' });
      }

      question = await Question.findByIdAndUpdate(id, body, {
        new: true,
        runValidators: true
      });

      return res.status(200).json({ success: true, data: question });
    }

    if (req.method === 'DELETE') {
      const question = await Question.findById(id);

      if (!question) {
        return res.status(404).json({ success: false, error: 'Question not found' });
      }

      await question.deleteOne();
      return res.status(200).json({ success: true, data: {} });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};
