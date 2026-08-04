const express = require('express');
const {
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  bulkUploadQuestions
} = require('../controllers/question.controller');
const upload = require('../middlewares/upload.middleware');

const { protect, authorize } = require('../middlewares/auth.middleware');

// mergeParams: true allows us to access quizId from quiz router
const router = express.Router({ mergeParams: true });

router.route('/')
  .get(protect, getQuestions)
  .post(protect, authorize('Admin'), addQuestion);

router.route('/bulk')
  .post(protect, authorize('Admin'), upload.single('file'), bulkUploadQuestions);

router.route('/:id')
  .put(protect, authorize('Admin'), updateQuestion)
  .delete(protect, authorize('Admin'), deleteQuestion);

module.exports = router;
