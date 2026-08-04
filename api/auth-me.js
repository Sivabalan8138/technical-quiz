const { protect } = require('../backend/src/utils/auth');
const connectDB = require('../backend/src/config/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    await connectDB();
    const user = await protect(req);
    
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    return res.status(401).json({ success: false, error: err.message });
  }
};
