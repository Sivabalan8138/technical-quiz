const express = require('express');
const {
  getQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getMyResults
} = require('../controllers/quiz.controller');

const questionRouter = require('./question.routes');

const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// Re-route into other resource routers
router.use('/:quizId/questions', questionRouter);

router.get('/my-results', protect, getMyResults);

router.route('/')
  .get(getQuizzes)
  .post(protect, authorize('Admin'), createQuiz);

router.route('/:id')
  .get(getQuiz)
  .put(protect, authorize('Admin'), updateQuiz)
  .delete(protect, authorize('Admin'), deleteQuiz);

const { submitQuiz } = require('../controllers/quiz.controller');
router.post('/:id/submit', protect, submitQuiz);

module.exports = router;
