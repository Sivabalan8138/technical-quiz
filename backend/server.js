const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Load env vars
dotenv.config();

const User = require('./src/models/User');

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@techquiz.com' });
    if (!adminExists) {
      await User.create({
        name: 'Super Admin',
        email: 'admin@techquiz.com',
        password: 'password123',
        role: 'Admin'
      });
      console.log('✅ Default Admin created: admin@techquiz.com / password123');
    }
  } catch (e) {
    console.error('Failed to seed admin', e);
  }
};

// Connect to database
connectDB().then(() => {
  seedAdmin();
}).catch(err => {
  console.error('Failed to connect to database before seeding', err);
});

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Route files
const auth = require('./src/routes/auth.routes');
const admin = require('./src/routes/admin.routes');
const quiz = require('./src/routes/quiz.routes');
const question = require('./src/routes/question.routes');

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/admin', admin);
app.use('/api/v1/quizzes', quiz);
app.use('/api/v1/questions', question);

app.get('/', (req, res) => {
  res.send('TechQuiz API is running');
});

module.exports = app;

// Add local server startup
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}
